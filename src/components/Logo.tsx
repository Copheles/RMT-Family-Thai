import React from "react";

const Logo: React.FC<React.ImgHTMLAttributes<HTMLImageElement>> = (props) => (
  <img src="/rmt-family.png" alt="RMT Family Logo" {...props} />
);

export default Logo;
