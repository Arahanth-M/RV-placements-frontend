import React from 'react';
import { resourceCategories, iconMap } from '../data/resourcesData';

const Resources = () => {
  // Get icon component dynamically
  const getIcon = (iconName) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className="text-3xl text-white" /> : null;
  };

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8" style={{ backgroundColor: '#302C2C' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-3 sm:mb-4">
            Study Resources
          </h1>
          <p className="text-sm sm:text-base md:text-lg lg:text-xl text-slate-400 max-w-3xl mx-auto px-2">
            Curated collection of resources to help you ace your technical interviews and excel in your career
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {resourceCategories.map((category, index) => (
            <div
              key={category.id}
              className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Category Header */}
              <div className="bg-slate-800/60 border-b border-slate-700 text-white p-4 sm:p-6">
                <div className="flex items-center space-x-2 sm:space-x-4">
                  <div className="text-2xl sm:text-3xl">{getIcon(category.icon)}</div>
                  <h2 className="text-lg sm:text-xl md:text-2xl font-semibold text-indigo-400">{category.title}</h2>
                </div>
              </div>

              {/* Resources List */}
              <div className="p-4 sm:p-6">
                <ul className="space-y-2 sm:space-y-3">
                  {category.resources.map((resource) => (
                    <li key={resource.id} className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        {resource.affiliate ? (
                          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-yellow-600 text-white">
                            Affiliate
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded text-xs font-medium bg-green-600 text-white">
                            Free
                          </span>
                        )}
                      </div>
                      <div className="ml-2 sm:ml-3 flex-1 min-w-0">
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm sm:text-base text-slate-300 hover:text-indigo-400 transition-colors break-words"
                        >
                          {resource.name}
                        </a>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="mt-8 sm:mt-12 bg-slate-900/70 backdrop-blur border border-slate-800 rounded-lg p-4 sm:p-6 max-w-4xl mx-auto">
          <h3 className="text-base sm:text-lg font-semibold text-indigo-400 mb-2">
            📝 Affiliate Link Disclaimer
          </h3>
          <p className="text-slate-300 text-xs sm:text-sm">
            Some links in this section are affiliate links. When you purchase through these links, 
            we may earn a small commission at no extra cost to you. This helps us maintain and improve 
            the platform. All resources are selected based on their educational value and quality.
          </p>
        </div>

        {/* Call to Action */}
        <div className="mt-8 sm:mt-12 text-center">
          <div className="bg-slate-900/70 backdrop-blur border border-slate-800 rounded-xl p-6 sm:p-8">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-white mb-3 sm:mb-4">Ready to Start Learning?</h2>
            <p className="text-sm sm:text-base md:text-lg mb-4 sm:mb-6 text-slate-400">
              Begin your journey with these carefully curated resources and boost your placement preparation
            </p>
            <a
              href="/companystats"
              className="inline-block bg-indigo-600 text-white px-6 sm:px-8 py-2 sm:py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-sm sm:text-base"
            >
              Explore Company Stats
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Resources;
