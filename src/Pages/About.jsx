import React from 'react';
import { motion } from 'framer-motion';
import { 
  MdCheckCircle, 
  MdTimeline, 
  MdScience, 
  MdPublic, 
  MdGroups, 
  MdTrendingUp,
  MdArrowForward
} from 'react-icons/md';
import { useNavigate } from 'react-router-dom';

const About = () => {
  const navigate = useNavigate();

  const fadeIn = {
    initial: { opacity: 0, y: 30 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true },
    transition: { duration: 0.8, ease: "easeOut" }
  };

  const staggerContainer = {
    initial: { opacity: 0 },
    whileInView: { opacity: 1 },
    viewport: { once: true },
    transition: { staggerChildren: 0.2 }
  };

  const stats = [
    { label: "Years of Heritage", value: "23+", icon: <MdTimeline size={32} /> },
    { label: "Happy Farmers", value: "10K+", icon: <MdGroups size={32} /> },
    { label: "Quality Standards", value: "ISO", icon: <MdCheckCircle size={32} /> },
    { label: "Market Presence", value: "Pan-India", icon: <MdPublic size={32} /> },
  ];

  const features = [
    {
      title: "Scientific Formulation",
      desc: "Our feeds are developed using advanced nutritional science to ensure optimal growth and health.",
      icon: <MdScience size={28} className="text-primary" />,
      color: "bg-blue-50"
    },
    {
      title: "Premium Raw Materials",
      desc: "We source only the finest ingredients directly from MMC Group's certified network.",
      icon: <MdCheckCircle size={28} className="text-emerald-500" />,
      color: "bg-emerald-50"
    },
    {
      title: "Growth-Centric Results",
      desc: "Designed to maximize productivity and profitability for every farmer we serve.",
      icon: <MdTrendingUp size={28} className="text-amber-500" />,
      color: "bg-amber-50"
    }
  ];

  return (
    <div className="bg-white overflow-hidden">
      
      {/* 1. BRAND INTRODUCTION (HERO) */}
      <section className="relative min-h-[90vh] flex items-center pt-20 px-6 overflow-hidden">
        {/* Decorative background elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full bg-primary/5 rounded-bl-[10rem] -z-10 translate-x-20"></div>
        <div className="absolute bottom-10 left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div {...fadeIn} className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-black tracking-widest uppercase">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse"></span>
              The Holstein Standard
            </div>
            <h1 className="text-5xl md:text-7xl font-black text-gray-900 leading-[1.1]">
              Elevating <span className="text-primary italic">Livestock</span> Welfare Since 2001.
            </h1>
            <p className="text-xl text-gray-400 font-medium leading-relaxed max-w-xl">
              Holstein Nutrition is more than a feed company; we are your partners in agricultural success, combining scientific precision with a legacy of trust.
            </p>
            <div className="flex flex-wrap gap-4">
              <button 
                onClick={() => navigate('/product')}
                className="px-10 py-5 bg-primary font-medium text-white font-black rounded-3xl hover:bg-primary/90 transition-all shadow-2xl shadow-primary/20 hover:-translate-y-1 flex items-center gap-3"
              >
                Explore Products <MdArrowForward size={24} />
              </button>
              {/* <div className="flex items-center gap-4 px-6 border-l-2 border-gray-100">
                <div className="flex -space-x-4">
                  {[1,2,3].map(i => (
                    <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-gray-100 overflow-hidden">
                      <img src={`https://i.pravatar.cc/100? img=${i+10}`} alt="Farmer" />
                    </div>
                  ))}
                </div>
                <div className="text-sm font-bold text-gray-500">
                  <span className="text-gray-900 block">10,000+ Trusting</span>
                  Farmers Across India
                </div> */}
              {/* </div> */}
            </div>
          </motion.div>

          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: -5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="relative"
          >
            <div className="relative z-10 rounded-[4rem] overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] bg-white border border-gray-100">
              <img src="/public/image/about-cow.jpg" alt="Happy Livestock" className="w-full h-full object-cover rounded-[4rem] p-4" />
            </div>
            {/* Glass Card Accent */}
            <div className="absolute -bottom-10 -left-10 p-8 bg-white/80 backdrop-blur-xl border border-white/50 rounded-[3rem] shadow-2xl z-20 max-w-[280px] hidden md:block">
              <div className="flex items-center gap-4 mb-3">
                <div className="">
                  <MdCheckCircle size={30} className='bg-primary text-white rounded-full p-1' />
                </div>
                <div className="font-black text-gray-900">Premium Quality Certified</div>
              </div>
              <p className="text-xs text-gray-400 font-bold leading-relaxed">Every batch is tested against international nutritional standards.</p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2. OUR STORY & MISSION */}
      <section className="py-32 px-6 bg-gray-50/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            <motion.div {...fadeIn} className="order-2 lg:order-1">
              <div className="relative">
                <div className="absolute -inset-10 bg-primary/5 rounded-[5rem] blur-2xl -z-10"></div>
                <img 
                  src="/public/image/Final-Logo-1.jpg" 
                  alt="MMC Group Heritage" 
                  className="w-full max-w-lg mx-auto rounded-[3rem] bg-white p-12 shadow-xl border border-gray-100"
                />
              </div>
            </motion.div>

            <motion.div {...fadeIn} className="space-y-10 order-1 lg:order-2">
              <div className="space-y-4">
                <span className="text-primary font-black tracking-widest uppercase text-sm">Founded in 2001</span>
                <h2 className="text-4xl md:text-5xl font-black text-gray-900 leading-tight">
                  Born from <span className="text-primary">Legacy</span>,<br /> Driven by Science.
                </h2>
              </div>
              <div className="space-y-6 text-lg text-gray-500 font-medium leading-relaxed">
                <p>
                  Holstein Nutrition is a proud subsidiary of <span className="text-gray-900 font-bold">MMC Group</span> (Mahajan Molasses Company). Decades of expertise in ingredient sourcing has shaped our ability to create the perfect nutritional balance.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6">
                  <div className="space-y-3">
                    <h4 className="font-black text-gray-900 text-xl underline decoration-primary/30 underline-offset-8">Our Vision</h4>
                    <p className="text-sm">To be the most trusted name in livestock nutrition globally, fostering agricultural growth through innovation.</p>
                  </div>
                  <div className="space-y-3">
                    <h4 className="font-black text-gray-900 text-xl underline decoration-primary/30 underline-offset-8">Our Mission</h4>
                    <p className="text-sm">Empowering farmers with high-quality, scientifically-backed feed that ensures the health and productivity of their cattle.</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 3. WHY CHOOSE US (USPs) */}
      <section className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-3xl mx-auto mb-20 space-y-6">
            <h2 className="text-4xl md:text-6xl font-black text-gray-900">Why Farmers <span className="text-primary italic">Trust</span> Us</h2>
            <p className="text-xl text-gray-400 font-medium leading-relaxed">We combine the wisdom of experience with the power of modern science to deliver consistency in every grain.</p>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="whileInView"
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {features.map((feature, idx) => (
              <motion.div 
                key={idx}
                variants={fadeIn}
                className="group p-10 bg-white border border-gray-100 rounded-[3rem] hover:border-primary/20 hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500"
              >
                <div className={`w-16 h-16 ${feature.color} rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 group-hover:rotate-3 transition-transform`}>
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-black text-gray-900 mb-4">{feature.title}</h3>
                <p className="text-gray-400 font-bold text-sm leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 4. TRUST & CALL TO ACTION */}
      <section className="py-20 px-6 ">
        <div className="max-w-7xl mx-auto bg-gray-900 rounded-[4rem] p-10 md:p-20 relative overflow-hidden">
          {/* Accent decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -z-0"></div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-10">
              <h2 className="text-4xl md:text-5xl font-black text-white leading-tight">
                Ready to Join the <span className="text-primary">Holstein</span> Family?
              </h2>
              <div className="grid grid-cols-2 gap-10">
                {stats.map((stat, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="text-primary">{stat.icon}</div>
                    <div className="text-3xl font-black text-white">{stat.value}</div>
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-widest">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center lg:items-end justify-center space-y-6">
              <div className="p-1.5 bg-white/5 rounded-[2.5rem] w-full max-w-sm">
                <div className="bg-white/10 backdrop-blur-md rounded-[2.2rem] p-8 space-y-4 border border-white/10">
                   <p className="text-white font-bold text-center">Quality nutrition for a prosperous future starts here.</p>
                   <button 
                    onClick={() => navigate('/product')}
                    className="w-full py-5 bg-white text-gray-900 font-black rounded-3xl hover:bg-primary hover:text-white transition-all shadow-xl flex items-center justify-center gap-3"                   >
                     Shop Our Feed <MdArrowForward size={24} />
                   </button>
                </div>
              </div>
              <p className="text-gray-500 font-bold text-sm">Join thousands of farmers growing with us.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Spacing for mobile to prevent content from being hidden behind the dock */}
      <div className="lg:hidden h-24"></div>
    </div>
  );
};

export default About;
