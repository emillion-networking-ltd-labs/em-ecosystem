import React from 'react';

const MockImage = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
  // eslint-disable-next-line @next/next/no-img-element, jsx-a11y/alt-text
  return <img {...props} />;
};

MockImage.displayName = 'MockImage';
export default MockImage;
