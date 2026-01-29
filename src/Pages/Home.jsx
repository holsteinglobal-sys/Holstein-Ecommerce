import HomeImage from "./HomeImage.jsx";
import Heading from "../Component/Heading.jsx";
import Card from "../Component/Card.jsx";
import Heading2 from "../Component/Heading2.jsx";
import Testimonial from "../Component/Testimonial.jsx";
import { products } from "../Data/product.js";
import Timeline from "../Component/Timeline.jsx";




const Home = () => {

   
  return (
    <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-100">
      {/* <Navbar /> */}
      <HomeImage/>
      <Heading />

   
      {/* <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-10 my-8 mx-auto max-w-6xl ">
      {products.map((item) => (
        <Card
          key={item.id}
          id={item.id}
          image={item.image}
          title={item.title}
          description={item.description}
        />
      ))}
      
    </div> */}

    

    <Timeline/>

      
      {/* <Heading2 /> */}
      <Testimonial />
    </div>
  );
};

export default Home;
