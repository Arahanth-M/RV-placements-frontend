

import React from "react";
import ReactPlayer from "react-player";

function VideoTab({ videoUrl }) {
  if (!videoUrl) {
    return (
      <div className="bg-white shadow-md rounded-lg p-6 border">
        <p className="text-gray-600">No video available for this company</p>
      </div>
    );
  }

  console.log(videoUrl);

  return (
    <div className="bg-white shadow-md rounded-lg p-6 border">
      <h2 className="text-2xl font-bold mb-4">Company Video</h2>
      <div className="flex justify-center">
        {/* <ReactPlayer
          url={videoUrl}
          controls
          width="100%"
          height="400px"
          playing={false}
          crossOrigin="anonymous"   
          config={{
            file: {
              attributes: {
                crossOrigin: "anonymous",
              },
            },
          }}
        /> */}
        <video
  src={videoUrl}
  controls
  width="720"
  height="400"
  crossOrigin="anonymous"
/>
      </div>
    </div>
  );
}

export default VideoTab;
