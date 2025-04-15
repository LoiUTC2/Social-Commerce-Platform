import React from 'react';
import HeaderTop from './HeaderTop';
import HeaderMain from './HeaderMain';

const Header = () => {
  return (
    <>
      <HeaderTop />
      <div className="sticky top-0 z-50 bg-white shadow">
        <HeaderMain />
      </div>
    </>
  );
};

export default Header;
