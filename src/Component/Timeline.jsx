import React from 'react';
import { FaChevronRight } from 'react-icons/fa';

const Timeline = () => {
  const stages = [
    {
      age: "0–2 Months",
      title: "Calf Starter",
      description: "Introduced from early age to develop rumen, support immunity, enable early weaning (45–60 days), and ensure faster growth.",
      color: "border-blue-500",
      bg: "bg-blue-50",
      iconColor: "text-blue-500"
    },
    {
      age: "3–8 Months",
      title: "Calf Growth Booster",
      description: "Supports skeletal growth, muscle development, rumen maturity, and prepares calves for future productivity.",
      color: "border-emerald-500",
      bg: "bg-emerald-50",
      iconColor: "text-emerald-500"
    },
    {
      age: "12–18 Months",
      title: "Heifer Prime Care",
      description: "Ensures proper body frame growth, fertility development, and timely breeding without excess fat deposition.",
      color: "border-purple-500",
      bg: "bg-purple-50",
      iconColor: "text-purple-500"
    },
    {
      age: "Dry Period",
      title: "Ultimate Dry Care",
      description: "Supports udder healing, fetal growth, and prevents metabolic diseases before calving.",
      color: "border-amber-500",
      bg: "bg-amber-50",
      iconColor: "text-amber-500"
    },
    {
      age: "Last 21 Days",
      title: "Transition Wellness (Pre-20)",
      description: "Prepares rumen for lactation, boosts immunity, and reduces milk fever and ketosis risks.",
      color: "border-rose-500",
      bg: "bg-rose-50",
      iconColor: "text-rose-500"
    },
    {
        age: "21 Days",
      title: "Transition Wellness (Post-20)",
      description: "Restores energy balance, improves appetite, and supports peak milk production safely.",
      color: "border-pink-500",
      bg: "bg-pink-50",
      iconColor: "text-pink-500"
    },
     {
        age: "Lactation Phase",
      title: "Xtra Milk Series",
      description: "Balanced nutrition for cows producing 20–30+ liters/day, improving milk yield, fat %, SNF, and reproductive efficiency.",
      color: "border-accent",
      bg: "bg-accent/10",
      iconColor: "text-accent"
    }
  ];

  return (
    <section className="py-24 px-6 md:px-12 ">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-20">
          <span className="inline-block px-4 py-1.5 mb-6 text-sm font-bold tracking-widest text-primary uppercase bg-primary/10 rounded-full">
            Nutrition Roadmap
          </span>
          <h2 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 leading-tight">
            Cow Feeding Guide: <span className="text-primary italic font-medium">Stage-Wise Nutrition</span>
          </h2>
          <p className="max-w-2xl mx-auto text-gray-600 text-lg md:text-xl leading-relaxed">
            Scientifically optimized nutrition plans designed for every critical life stage of your livestock.
          </p>
        </div>

        <div className="relative">
          {/* Vertical Middle Line (Desktop) */}
          <div className="absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-gradient-to-b from-primary/5 via-primary/20 to-primary/5 hidden md:block"></div>

          <div className="space-y-12 md:space-y-0">
            {stages.map((stage, index) => (
              <div key={index} className={`flex flex-col md:flex-row items-center justify-between w-full md:mb-16 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}>
                
                {/* Content Side */}
                <div className="w-full md:w-[45%] group">
                  <div className={`p-8 bg-white rounded-3xl border-l-8 ${stage.color} shadow-xl shadow-gray-200/40 hover:shadow-2xl hover:shadow-primary/10 transition-all duration-500 hover:-translate-y-2`}>
                    <div className="flex items-center gap-3 mb-4">
                      <span className={`px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest ${stage.bg} ${stage.iconColor}`}>
                        {stage.age}
                      </span>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center justify-between">
                       {stage.title}
                       <FaChevronRight className={`text-sm opacity-0 group-hover:opacity-100 group-hover:translate-x-2 transition-all duration-300 ${stage.iconColor}`} />
                    </h3>
                    <p className="text-gray-600 leading-relaxed text-lg italic font-medium">
                      "{stage.description}"
                    </p>
                  </div>
                </div>

                {/* Dot in Middle */}
                <div className="hidden md:flex absolute left-1/2 transform -translate-x-1/2 w-10 h-10 rounded-full bg-white border-4 border-primary shadow-lg items-center justify-center z-10">
                   <div className="w-4 h-4 rounded-full bg-primary animate-pulse"></div>
                </div>

                {/* Empty Spacer Side */}
                <div className="hidden md:block w-full md:w-[45%]"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default Timeline;