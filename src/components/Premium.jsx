const Premium = () => {
    return (
      <div className="flex w-full items-center justify-center space-x-4">
        {/* Left Card */}
        <div className="rounded-lg bg-gray-200 h-80 w-full flex-grow items-center justify-center">
          <h1>Silver Membership</h1>
          <li>
            <ol>feature 1</ol>
            <ol>feature 2</ol>
          </li>
          <button className = "bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600">Buy Silver</button>
        </div>
  
        {/* Divider with text */}
        <div className="flex items-center">
          <div className="h-full border-l border-gray-300"></div>
          <span className="px-3 text-gray-500 text-sm">OR</span>
          <div className="h-full border-l border-gray-300"></div>
        </div>
  
        {/* Right Card */}
        <div className="rounded-lg bg-gray-200 h-80 w-full flex-grow items-center justify-center">
          <h1>Gold Premium Membership</h1>
          <li>
          <ol>feature 1</ol>
          <ol>feature 2</ol>
          </li>
          <button className = "bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-600">Buy Gold</button>
        </div>
      </div>
    );
  };
  
  export default Premium;
  