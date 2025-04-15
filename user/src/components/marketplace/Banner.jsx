import React from 'react';
import BannerImg from '../../assets/logoHULO.png'
export default function Banner() {
  return (
    <div className="w-full overflow-hidden rounded-xl shadow mb-4">
      <img
        src={BannerImg}
        alt="Banner quảng cáo"
        className="w-full h-52 object-cover"
      />
    </div>
  );
}
