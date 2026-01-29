import React from 'react';
import AboutHero from '../Component/AboutHero.jsx';
import AboutContent from '../Component/AboutContent.jsx';
import AboutValues from '../Component/AboutValues.jsx';
import FAQ from '../Component/FAQ.jsx';

const About = () => {
  return (
    <div className='bg-gradient-to-br from-indigo-50 via-white to-indigo-100'>
      <AboutHero />
      <AboutContent />
      <AboutValues />
      <FAQ />
    </div>
  );
};

export default About;