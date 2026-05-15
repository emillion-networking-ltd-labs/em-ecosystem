/**
 * Online ML Scorer Service — SCRUM-460 / Phase 8 / Cap 5 (SHADOW + read-only).
 *
 * Default mode: SHADOW (always — flipping to "use score for blocking"
 * requires SEPARATE §15-compliant security review beyond Phase 8 scope).
 *
 * Scores incoming requests at request time using pure-stdlib z-score
 * (mirror of Phase 5 §6 offline scorer). Hard constraints:
 *   - No model file loaded.
 *   - Entity IDs (user_id, correlation_id) SHA256-HASHED before use.
 *   - IPs in shadow log: /24-prefix only.
 *   - No PII features.
 *   - AUTH paths SKIPPED before scoring.
 *
 * ── PHASE 5 §6.1 SPIRIT PRESERVATION ──────────────────────────────────────
 *
 * Phase 5 §6.1 prohibited ML inference that takes DECISIONS in production.
 * Phase 8 Cap 5 performs inference but decisions are ALWAYS shadow.
 * Flipping shadow→active for this template is gated by an additional
 * §15-compliant security review (not just the standard 3-layer flag).
 *
 * ── SOURCE & MODIFICATIONS ────────────────────────────────────────────────
 *
 * Mirror of ai-specs/templates/online-ml-scorer-nestjs.ts (SCRUM-460).
 * Single deliberate divergence: shadowLog() honors SHADOW_LOG_PATH env var
 * as intermediate fallback to align with consolidation systemd wrappers
 * (OQ-1 of Phase 8 Cap 5 install design).
 */

import { Injectable, Logger } from '@nestjs/common';
import { Request } from 'express';
import { readFileSync, appendFileSync, existsSync } from 'fs';
import { createHash } from 'crypto';
import * as yaml from 'js-yaml';

const AUTH_SKIP = ['/auth/', '/oauth/', '/sessions/', '/mfa/', '/passkey/'];

interface FlagsFile {
  enforcement_mode?: 'shadow' | 'active';
  ml_inference?: { enabled?: boolean };
  shadow_log_path?: string;
}

interface RollingStats {
  count: number;
  sum: number;
  sumSq: number;
}

@Injectable()
export class OnlineMlScorerService {
  private readonly logger = new Logger('OnlineMlScorerService');
  private flags: FlagsFile = {};
  private lastFlagsLoad = 0;
  private readonly flagsPath =
    process.env.ONLINE_FLAGS_PATH ?? 'online-enforcement-flags.yml';

  private statsByEntity = new Map<
    string,
    { duration: RollingStats; status4xx: RollingStats }
  >();
  private static readonly MAX_ENTRIES = 10_000;

  /**
   * Score a request. Call from a per-request interceptor or middleware.
   * Pure shadow — return value is only for logging / informational use.
   * Decisions never act on the score in Phase 8.
   */
  score(
    req: Request,
    durationMs: number,
    statusCode: number,
  ): {
    score: number;
    would_have_action: string;
  } {
    if (AUTH_SKIP.some((p) => req.path.startsWith(p))) {
      return { score: 0, would_have_action: 'skipped_auth_path' };
    }

    this.reloadFlagsIfStale();
    const capEnabled = this.flags.ml_inference?.enabled === true;
    if (!capEnabled) return { score: 0, would_have_action: 'cap_disabled' };

    // 3-layer flag check intentionally short-circuited for ML inference:
    // effectiveMode is hardcoded 'shadow' regardless of env/YAML mode
    // (Phase 5 §6.1 spirit preservation — see header comment).

    const userId = (req as Request & { user?: { id?: string } }).user?.id;
    const correlationId = (req as Request & { correlationId?: string })
      .correlationId;
    const entityKey = userId
      ? `user:${this.hashId(userId)}`
      : correlationId
        ? `session:${this.hashId(correlationId)}`
        : `ip_24:${this.ip24Prefix(req.ip ?? '')}`;

    const stats = this.getOrCreateStats(entityKey);
    this.updateRolling(stats.duration, durationMs);
    if (statusCode >= 400 && statusCode < 500) {
      this.updateRolling(stats.status4xx, 1);
    } else {
      this.updateRolling(stats.status4xx, 0);
    }

    const meanDur = stats.duration.sum / stats.duration.count;
    const varDur =
      stats.duration.sumSq / stats.duration.count - meanDur * meanDur;
    const stdDur = Math.sqrt(Math.max(varDur, 0));
    const zDur = stdDur > 0 ? Math.abs(durationMs - meanDur) / stdDur : 0;

    const anomalyScore = Math.tanh(zDur / 4.0);

    const threshold = 0.9;
    const wouldHaveAction =
      anomalyScore >= threshold
        ? `elevate_for_review_at_threshold_${threshold}`
        : 'none';

    this.shadowLog({
      ts: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
      cap: 'ml_inference',
      shadow_mode: true,
      correlation_id: correlationId ?? null,
      request_path: req.path,
      request_method: req.method,
      decision: anomalyScore >= threshold ? 'would_deny' : 'allowed',
      reason: `anomaly_score=${anomalyScore.toFixed(4)} (z=${zDur.toFixed(2)})`,
      would_have_action: wouldHaveAction,
      target: {
        kind: userId ? 'user' : correlationId ? 'session' : 'ip',
        value: entityKey.split(':', 2)[1],
        id_form: userId || correlationId ? 'sha256_12' : 'ip_24',
      },
      metadata: {
        anomaly_score: anomalyScore,
        z_score: zDur,
        cohort_size: stats.duration.count,
      },
    });

    return { score: anomalyScore, would_have_action: wouldHaveAction };
  }

  private hashId(s: string): string {
    return createHash('sha256').update(s).digest('hex').substring(0, 12);
  }

  private ip24Prefix(ip: string): string {
    if (ip.includes('.')) {
      const parts = ip.split('.');
      if (parts.length === 4) return parts.slice(0, 3).join('.') + '.0/24';
    }
    if (ip.includes(':')) {
      return ip.split(':').slice(0, 3).join(':') + '::/48';
    }
    return 'unknown';
  }

  private getOrCreateStats(key: string) {
    let stats = this.statsByEntity.get(key);
    if (!stats) {
      stats = {
        duration: { count: 0, sum: 0, sumSq: 0 },
        status4xx: { count: 0, sum: 0, sumSq: 0 },
      };
      if (this.statsByEntity.size >= OnlineMlScorerService.MAX_ENTRIES) {
        const firstKey = this.statsByEntity.keys().next().value;
        if (firstKey) this.statsByEntity.delete(firstKey);
      }
      this.statsByEntity.set(key, stats);
    }
    return stats;
  }

  private updateRolling(stats: RollingStats, value: number): void {
    stats.count++;
    stats.sum += value;
    stats.sumSq += value * value;
  }

  private shadowLog(entry: Record<string, unknown>): void {
    try {
      const path =
        this.flags.shadow_log_path ??
        process.env.SHADOW_LOG_PATH ??
        '/var/log/shadow-decisions.jsonl';
      // path is operator-controlled config (YAML or env var), not user input.
      // eslint-disable-next-line security/detect-non-literal-fs-filename
      appendFileSync(path, JSON.stringify(entry) + '\n');
    } catch {
      // Fail-open on logging error — never block the request path.
    }
  }

  private reloadFlagsIfStale(): void {
    const now = Date.now();
    if (now - this.lastFlagsLoad <= 30_000) return;
    // flagsPath is operator-controlled config (env var with hardcoded fallback), not user input.
    // eslint-disable-next-line security/detect-non-literal-fs-filename
    if (!existsSync(this.flagsPath)) return;
    try {
      this.flags = yaml.load(
        // eslint-disable-next-line security/detect-non-literal-fs-filename
        readFileSync(this.flagsPath, 'utf-8'),
      ) as FlagsFile;
    } catch (e) {
      this.logger.error(`flags: ${(e as Error).message}`);
    }
    this.lastFlagsLoad = now;
  }
}
