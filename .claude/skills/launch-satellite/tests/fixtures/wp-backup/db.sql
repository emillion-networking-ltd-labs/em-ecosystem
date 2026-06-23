CREATE TABLE `wp_posts` (
  `ID` text,
  `post_author` text,
  `post_date` text,
  `post_date_gmt` text,
  `post_content` text,
  `post_title` text,
  `post_excerpt` text,
  `post_status` text,
  `comment_status` text,
  `ping_status` text,
  `post_password` text,
  `post_name` text,
  `to_ping` text,
  `pinged` text,
  `post_modified` text,
  `post_modified_gmt` text,
  `post_content_filtered` text,
  `post_parent` text,
  `guid` text,
  `menu_order` text,
  `post_type` text,
  `post_mime_type` text,
  `comment_count` text
) ENGINE=InnoDB;
INSERT INTO `wp_posts` VALUES
(2,1,'2024-01-01 00:00:00','2024-01-01 00:00:00','','Home','','publish','closed','closed','','home','','','2024-01-01 00:00:00','2024-01-01 00:00:00','',0,'https://fixture.test/?p=2',0,'page','',0),
(3,1,'2024-01-01 00:00:00','2024-01-01 00:00:00','<p>About <b>us</b></p>','About','','publish','closed','closed','','about','','','2024-01-01 00:00:00','2024-01-01 00:00:00','',0,'https://fixture.test/?p=3',1,'page','',0),
(4,1,'2024-01-01 00:00:00','2024-01-01 00:00:00','<p>Hello world</p>','First News','','publish','closed','closed','','news-1','','','2024-01-01 00:00:00','2024-01-01 00:00:00','',0,'https://fixture.test/?p=4',0,'post','',0);
CREATE TABLE `wp_postmeta` (
  `meta_id` bigint,
  `post_id` bigint,
  `meta_key` varchar(255),
  `meta_value` longtext
) ENGINE=InnoDB;
INSERT INTO `wp_postmeta` VALUES
(1,2,'_elementor_data','[{"id":"s1","elType":"section","elements":[{"id":"c1","elType":"column","elements":[{"id":"w1","elType":"widget","widgetType":"heading","settings":{"title":"Welcome to Fixture Co"}},{"id":"w2","elType":"widget","widgetType":"image","settings":{"image":{"url":"https://fixture.test/wp-content/uploads/2024/hero.jpg","id":99}}},{"id":"w3","elType":"widget","widgetType":"text-editor","settings":{"editor":"We don\'t quit. Real copy, semicolons; and commas, kept."}}]}]}]'),
(2,3,'_wp_attached_file','2024/team.png'),
(3,3,'_yoast_wpseo_title','About Page — Yoast Title'),
(4,3,'_yoast_wpseo_metadesc','Yoast about meta description, real and verbatim.');
CREATE TABLE `wp_aioseo_posts` (
  `id` bigint,
  `post_id` bigint,
  `title` text,
  `description` text,
  `canonical_url` text,
  `og_title` text,
  `og_description` text
) ENGINE=InnoDB;
INSERT INTO `wp_aioseo_posts` VALUES
(1,2,'Custom Home SEO Title','Custom home meta description for SEO.',NULL,NULL,NULL);
CREATE TABLE `wp_options` (
  `option_id` bigint,
  `option_name` varchar(191),
  `option_value` longtext,
  `autoload` varchar(20)
) ENGINE=InnoDB;
INSERT INTO `wp_options` VALUES
(1,'blogname','Fixture Co','yes'),
(2,'blogdescription','Demo logistics','yes'),
(3,'siteurl','https://fixture.test','yes'),
(4,'show_on_front','page','yes'),
(5,'page_on_front','2','yes'),
(6,'WPLANG','es_ES','yes');
