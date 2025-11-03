import React from 'react';
import { resourceCategories, iconMap } from '../data/resourcesData';

const Resources = () => {
  // Get icon component dynamically
  const getIcon = (iconName) => {
    const IconComponent = iconMap[iconName];
    return IconComponent ? <IconComponent className="text-3xl text-blue-600" /> : null;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-100 via-white to-indigo-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Study Resources
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Curated collection of resources to help you ace your technical interviews and excel in your career
          </p>
        </div>

        {/* Resources Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {resourceCategories.map((category, index) => (
            <div
              key={category.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
            >
              {/* Category Header */}
              <div className={`bg-gradient-to-r ${category.color} text-white p-6`}>
                <div className="flex items-center space-x-4">
                  {getIcon(category.icon)}
                  <h2 className="text-2xl font-bold">{category.title}</h2>
                </div>
              </div>

              {/* Resources List */}
              <div className="p-6">
                <ul className="space-y-3">
                  {category.resources.map((resource) => (
                    <li key={resource.id} className="flex items-start">
                      <div className="flex-shrink-0 mt-1">
                        {resource.affiliate ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                            Affiliate
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Free
                          </span>
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <a
                          href={resource.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 hover:underline font-medium break-words"
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
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6 max-w-4xl mx-auto">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            📝 Affiliate Link Disclaimer
          </h3>
          <p className="text-yellow-700 text-sm">
            Some links in this section are affiliate links. When you purchase through these links, 
            we may earn a small commission at no extra cost to you. This helps us maintain and improve 
            the platform. All resources are selected based on their educational value and quality.
          </p>
        </div>

        {/* Call to Action */}
        <div className="mt-12 text-center">
          <div className="bg-gradient-to-r from-indigo-600 to-blue-600 rounded-xl p-8 text-white">
            <h2 className="text-3xl font-bold mb-4">Ready to Start Learning?</h2>
            <p className="text-lg mb-6 opacity-90">
              Begin your journey with these carefully curated resources and boost your placement preparation
            </p>
            <a
              href="/companystats"
              className="inline-block bg-white text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition duration-200"
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
