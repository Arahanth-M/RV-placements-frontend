// resourcesData.js - Centralized resource data
import { FaBook, FaVideo, FaCode, FaLaptopCode, FaDatabase, FaCloud, FaMobileAlt, FaNetworkWired } from 'react-icons/fa';

export const resourceCategories = [
  {
    id: 'dsa',
    title: "Data Structures & Algorithms",
    icon: "FaCode",
    color: "from-blue-500 to-blue-600",
    resources: [
      { 
        id: 'geeksforgeeks-dsa',
        name: "GeeksforGeeks - DSA Tutorial", 
        url: "https://www.geeksforgeeks.org/data-structures/", 
        affiliate: false 
      },
      { 
        id: 'leetcode-premium',
        name: "LeetCode Premium - Practice Problems", 
        url: "https://leetcode.com/subscribe/", 
        affiliate: true 
      },
      { 
        id: 'neetcode',
        name: "NeetCode - Algorithm Explanations", 
        url: "https://neetcode.io/", 
        affiliate: false 
      },
      { 
        id: 'strivers-sheet',
        name: "Striver's DSA Sheet", 
        url: "https://takeuforward.org/strivers-a2z-dsa-course/", 
        affiliate: false 
      },
      { 
        id: 'codechef',
        name: "CodeChef - Competitive Programming", 
        url: "https://www.codechef.com/", 
        affiliate: false 
      },
    ]
  },
  {
    id: 'system-design',
    title: "System Design",
    icon: "FaNetworkWired",
    color: "from-purple-500 to-purple-600",
    resources: [
      { 
        id: 'grokking-sd',
        name: "Grokking the System Design Interview", 
        url: "https://www.educative.io/courses/grokking-the-system-design-interview", 
        affiliate: true 
      },
      { 
        id: 'sd-primer',
        name: "System Design Primer - GitHub", 
        url: "https://github.com/donnemartin/system-design-primer", 
        affiliate: false 
      },
      { 
        id: 'high-scalability',
        name: "High Scalability - Blog", 
        url: "http://highscalability.com/", 
        affiliate: false 
      },
      { 
        id: 'aws-arch',
        name: "AWS Architecture Center", 
        url: "https://aws.amazon.com/architecture/", 
        affiliate: false 
      },
      { 
        id: 'ddia-book',
        name: "System Design Interview Books", 
        url: "https://www.amazon.com/Designing-Data-Intensive-Applications-Reliable-Maintainable/dp/1449373321", 
        affiliate: true 
      },
    ]
  },
  {
    id: 'fullstack',
    title: "Full Stack Development",
    icon: "FaLaptopCode",
    color: "from-green-500 to-green-600",
    resources: [
      { 
        id: 'mdn',
        name: "MDN Web Docs - Complete Reference", 
        url: "https://developer.mozilla.org/", 
        affiliate: false 
      },
      { 
        id: 'udemy-fullstack',
        name: "Udemy - Full Stack Bootcamp", 
        url: "https://www.udemy.com/course/the-complete-web-development-bootcamp/", 
        affiliate: true 
      },
      { 
        id: 'freecodecamp',
        name: "freeCodeCamp - Free Courses", 
        url: "https://www.freecodecamp.org/", 
        affiliate: false 
      },
      { 
        id: 'javascript-info',
        name: "JavaScript.info - JS Guide", 
        url: "https://javascript.info/", 
        affiliate: false 
      },
      { 
        id: 'react-docs',
        name: "React Documentation", 
        url: "https://react.dev/", 
        affiliate: false 
      },
    ]
  },
  {
    id: 'database',
    title: "Database & Backend",
    icon: "FaDatabase",
    color: "from-red-500 to-red-600",
    resources: [
      { 
        id: 'postgres-tutorial',
        name: "PostgreSQL Tutorial", 
        url: "https://www.postgresqltutorial.com/", 
        affiliate: false 
      },
      { 
        id: 'mongodb-university',
        name: "MongoDB University - Free Courses", 
        url: "https://university.mongodb.com/", 
        affiliate: false 
      },
      { 
        id: 'w3schools-sql',
        name: "SQL Tutorial - W3Schools", 
        url: "https://www.w3schools.com/sql/", 
        affiliate: false 
      },
      { 
        id: 'redis-docs',
        name: "Redis Documentation", 
        url: "https://redis.io/docs/", 
        affiliate: false 
      },
      { 
        id: 'db-design-books',
        name: "Database Design Books", 
        url: "https://www.amazon.com/Database-Design-Mere-Mortals-Hands/dp/0321884493", 
        affiliate: true 
      },
    ]
  },
  {
    id: 'cloud-devops',
    title: "Cloud & DevOps",
    icon: "FaCloud",
    color: "from-indigo-500 to-indigo-600",
    resources: [
      { 
        id: 'aws-cert',
        name: "AWS Certified Solutions Architect", 
        url: "https://www.udemy.com/course/aws-certified-solutions-architect-associate-saa-c03/", 
        affiliate: true 
      },
      { 
        id: 'kubernetes-docs',
        name: "Kubernetes Documentation", 
        url: "https://kubernetes.io/docs/home/", 
        affiliate: false 
      },
      { 
        id: 'docker-docs',
        name: "Docker Documentation", 
        url: "https://docs.docker.com/", 
        affiliate: false 
      },
      { 
        id: 'aws-free-tier',
        name: "AWS Free Tier", 
        url: "https://aws.amazon.com/free/", 
        affiliate: false 
      },
      { 
        id: 'gcp-docs',
        name: "Google Cloud Platform", 
        url: "https://cloud.google.com/docs", 
        affiliate: false 
      },
    ]
  },
  {
    id: 'mobile',
    title: "Mobile Development",
    icon: "FaMobileAlt",
    color: "from-orange-500 to-orange-600",
    resources: [
      { 
        id: 'flutter-docs',
        name: "Flutter Documentation", 
        url: "https://docs.flutter.dev/", 
        affiliate: false 
      },
      { 
        id: 'react-native-docs',
        name: "React Native Tutorial", 
        url: "https://reactnative.dev/docs/getting-started", 
        affiliate: false 
      },
      { 
        id: 'android-dev',
        name: "Android Developer Guide", 
        url: "https://developer.android.com/guide", 
        affiliate: false 
      },
      { 
        id: 'ios-dev',
        name: "iOS Development Tutorial", 
        url: "https://developer.apple.com/tutorials/", 
        affiliate: false 
      },
      { 
        id: 'flutter-course',
        name: "Mobile App Development Course", 
        url: "https://www.udemy.com/course/the-complete-flutter-development-bootcamp/", 
        affiliate: true 
      },
    ]
  },
  {
    id: 'interview-prep',
    title: "Interview Preparation",
    icon: "FaBook",
    color: "from-teal-500 to-teal-600",
    resources: [
      { 
        id: 'ctci-book',
        name: "Cracking the Coding Interview", 
        url: "https://www.amazon.com/Cracking-Coding-Interview-Programming-Questions/dp/0984782850", 
        affiliate: true 
      },
      { 
        id: 'interviewbit',
        name: "InterviewBit - Practice Platform", 
        url: "https://www.interviewbit.com/", 
        affiliate: false 
      },
      { 
        id: 'epi-book',
        name: "Elements of Programming Interviews", 
        url: "https://www.amazon.com/Elements-Programming-Interviews-Python-Insiders/dp/1537713949", 
        affiliate: true 
      },
      { 
        id: 'tech-interview-handbook',
        name: "Tech Interview Handbook", 
        url: "https://www.techinterviewhandbook.org/", 
        affiliate: false 
      },
      { 
        id: 'behavioral-guide',
        name: "Behavioral Interview Guide", 
        url: "https://www.amazon.com/Behavioral-Interview-Guide-Questions-Answers/dp/1735226125", 
        affiliate: true 
      },
    ]
  },
  {
    id: 'video-courses',
    title: "Video Courses & Tutorials",
    icon: "FaVideo",
    color: "from-pink-500 to-pink-600",
    resources: [
      { 
        id: 'coursera',
        name: "Coursera - Specializations", 
        url: "https://www.coursera.org/browse/computer-science", 
        affiliate: false 
      },
      { 
        id: 'freecodecamp-yt',
        name: "YouTube - freeCodeCamp Channel", 
        url: "https://www.youtube.com/@freecodecamp", 
        affiliate: false 
      },
      { 
        id: 'pluralsight',
        name: "Pluralsight - Tech Courses", 
        url: "https://www.pluralsight.com/", 
        affiliate: false 
      },
      { 
        id: 'educative',
        name: "Educative - Interactive Courses", 
        url: "https://www.educative.io/", 
        affiliate: true 
      },
      { 
        id: 'traversy-media',
        name: "Traversy Media - YouTube", 
        url: "https://www.youtube.com/@TraversyMedia", 
        affiliate: false 
      },
    ]
  },
];

// Icon mapping
export const iconMap = {
  FaCode,
  FaNetworkWired,
  FaLaptopCode,
  FaDatabase,
  FaCloud,
  FaMobileAlt,
  FaBook,
  FaVideo,
};
