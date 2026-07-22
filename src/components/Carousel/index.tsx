import { FC, useContext, useEffect } from 'react';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import {
  ButtonBack, ButtonNext, CarouselProvider, Slide, Slider, CarouselContext
} from 'pure-react-carousel';
import Img from 'components/Img';
import { Xfile } from 'shared/interfaces';
import c from 'shared/utilities/classname';
import s from './index.module.scss';
import 'pure-react-carousel/dist/react-carousel.es.css';

const CallbackComponent: FC<{ indexCallback: (i: number) => void; }> = ({ indexCallback }) => {
  const carouselContext = useContext(CarouselContext);
  useEffect(() => {
    const onChange = () => indexCallback(carouselContext.state.currentSlide || 0);
    carouselContext.subscribe(onChange);
    return () => carouselContext.unsubscribe(onChange);
  }, [carouselContext]);
  return null;
};

interface IProps {
  children: Xfile['data'][];
  sliderClass?: string;
  slideClass?: string;
  indexCallback?: (i: number) => void;
}
const Carousel: FC<IProps> = ({ children, sliderClass, slideClass, indexCallback = () => { } }) =>
  children.length > 0
    ? <CarouselProvider naturalSlideWidth={100} naturalSlideHeight={1} infinite
      totalSlides={children.length} className={c(s.slider, sliderClass)}>
      <CallbackComponent indexCallback={indexCallback} />
      <Slider>
        {children.map((img, ind) =>
          <Slide className={c(s.slide, slideClass)} index={ind} key={img.id}>
            <Img alt='' image={img} />
          </Slide>)}
      </Slider>
      {children.length > 1 &&
        <ButtonBack className={c(s.button, s.left)}><FaAngleLeft /></ButtonBack>}
      {children.length > 1 &&
        <ButtonNext className={c(s.button, s.right)}><FaAngleRight /></ButtonNext>}
    </CarouselProvider>
    : null;

export default Carousel;

