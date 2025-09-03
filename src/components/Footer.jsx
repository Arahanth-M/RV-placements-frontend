import React from "react";

function Footer() {
  return (
    <footer className="bg-blue-900 text-gray-300 py-4 mt-6">
      <div className="container mx-auto text-center">
        <p>© {new Date().getFullYear()} Placement Portal. All rights reserved.</p>
        <p className="text-sm"></p>
      </div>
    </footer>
  );
}

export default Footer;
