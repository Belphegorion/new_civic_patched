import React from 'react';
import HeroSection from '../components/landing/HeroSection.jsx';
import BlogHero from '../components/shared/BlogHero.jsx';
import { 
  CheckCircleIcon, 
  MapPinIcon, 
  BellIcon, 
  ChartBarIcon,
  ShieldCheckIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

const FeatureCard = ({ icon: Icon, title, description, delay = 0 }) => (
  <div className={`bg-white rounded-xl md:rounded-2xl p-6 md:p-8 shadow-lg active:shadow-xl md:hover:shadow-xl transition-all duration-300 md:hover:-translate-y-1 fade-in stagger-${delay}`}>
    <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg md:rounded-xl p-2.5 md:p-3 w-fit mb-4 md:mb-6">
      <Icon className="h-6 w-6 md:h-8 md:w-8 text-white" />
    </div>
    <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2 md:mb-3">{title}</h3>
    <p className="text-sm md:text-base text-gray-600 leading-relaxed">{description}</p>
  </div>
);

const LandingPage = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      
      {/* Mobile-optimized Features Section */}
      <section className="py-16 md:py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 md:mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4 px-2">
              Everything you need to
              <span className="gradient-text-primary block md:inline"> improve your community</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto px-4">
              Our platform provides all the tools citizens and administrators need to create positive change.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            <FeatureCard
              icon={MapPinIcon}
              title="Location-Based Reporting"
              description="Report issues with precise GPS coordinates and interactive maps for accurate problem identification."
              delay={1}
            />
            <FeatureCard
              icon={BellIcon}
              title="Real-Time Notifications"
              description="Stay updated with instant notifications about your reports and community issues that matter to you."
              delay={2}
            />
            <FeatureCard
              icon={ChartBarIcon}
              title="Progress Tracking"
              description="Monitor the status of reported issues with detailed analytics and transparent progress updates."
              delay={3}
            />
            <FeatureCard
              icon={ShieldCheckIcon}
              title="Secure & Private"
              description="Your data is protected with enterprise-grade security and privacy-first design principles."
              delay={4}
            />
            <FeatureCard
              icon={ClockIcon}
              title="Quick Response"
              description="Fast acknowledgment and resolution times with automated workflows and priority management."
              delay={5}
            />
            <FeatureCard
              icon={CheckCircleIcon}
              title="Verified Results"
              description="All reports are verified and tracked to completion with photo evidence and status updates."
              delay={6}
            />
          </div>
        </div>
      </section>

      {/* Blog hero inserted (matches site design) */}
      <BlogHero />
      
      {/* Mobile-optimized CTA Section */}
      <section className="py-16 md:py-24 bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-700">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 md:mb-6">
            Ready to make a difference?
          </h2>
          <p className="text-lg md:text-xl text-white/90 mb-8 md:mb-10 max-w-2xl mx-auto">
            Join thousands of citizens who are already making their communities better. Start reporting today.
          </p>
          <div className="flex flex-col gap-4 justify-center">
            <a href="/login" className="bg-white text-gray-900 px-6 py-4 md:px-8 rounded-2xl font-semibold text-base md:text-lg active:bg-gray-100 md:hover:bg-gray-100 transition-all duration-300 md:hover:scale-105 shadow-xl">
              Start Reporting Now
            </a>
            <a href="/register" className="bg-white/10 backdrop-blur-sm text-white px-6 py-4 md:px-8 rounded-2xl font-semibold text-base md:text-lg border-2 border-white/20 active:bg-white/20 md:hover:bg-white/20 md:hover:border-white/40 transition-all duration-300">
              Create Account
            </a>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
