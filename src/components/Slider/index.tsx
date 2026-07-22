import { FC, useCallback, useEffect, useState } from 'react';
import {
  Slider, Handles, Tracks, Rail, Ticks, GetHandleProps, GetTrackProps, SliderItem
} from 'react-compound-slider';
import { FaTimes } from 'react-icons/fa';
import s from './index.module.scss';

interface IHandleProps {
  handle: { id: string; value: number; percent: number; };
  getHandleProps: GetHandleProps;
}
const Handle: FC<IHandleProps> = ({ handle: { id, value, percent }, getHandleProps }) =>
  <div className={s.handle} style={{ left: `${percent}%` }} {...getHandleProps(id)}>
    <div className={s.value}>{value}</div>
  </div>;

interface ITrackProps {
  source: SliderItem; target: SliderItem; getTrackProps: GetTrackProps;
}
const Track: FC<ITrackProps> = ({ source, target, getTrackProps }) =>
  <div style={{ left: `${source.percent}%`, width: `${target.percent - source.percent}%` }}
    className={s.track} {...getTrackProps()} />;

interface ITickProps { tick: SliderItem; count: number; }
const Tick: FC<ITickProps> = ({ tick: { percent, value }, count }) =>
  <div className={s.tick}>
    <div className={s.line} style={{ left: `${percent}%` }} />
    <div className={s.number}
      style={{ marginLeft: `${-50 / count}%`, width: `${100 / count}%`, left: `${percent}%` }}>
      {value}
    </div>
  </div>;

interface ISliderProps {
  min: number;
  max: number;
  defValues: number[];
  values: number[];
  handleChange: (values?: readonly number[]) => void;
}
const SliderComponent: FC<ISliderProps> = ({ min, max, values, handleChange }) => {
  const [isReset, setIsReset] = useState(true);
  const handleReset = useCallback(() => {
    handleChange();
    setIsReset(true);
  }, []);

  useEffect(() => { handleReset(); }, [handleReset]);

  const handleSliderChange = (val: readonly number[]) => {
    handleChange(val);
    setIsReset(false);
  }

  return (
    <div className={s.container}>
      <Slider domain={[min, max]} step={1} mode={1} values={values} className={s.slider}
        onChange={handleSliderChange}>
        <Rail>
          {({ getRailProps }) => <div className={s.rail} {...getRailProps()} />}
        </Rail>
        {!isReset && <Handles>
          {({ handles, getHandleProps }) =>
            <div>
              {handles.map(h => <Handle key={h.id} handle={h} getHandleProps={getHandleProps} />)}
            </div>}
        </Handles>}
        {!isReset && <Tracks left={true} right={false}>
          {({ tracks, getTrackProps }) =>
            <div>
              {tracks.map(({ id, source, target }) =>
                <Track key={id} source={source} target={target} getTrackProps={getTrackProps} />)}
            </div>}
        </Tracks>}
        <Ticks values={[min, max]}>
          {({ ticks }) =>
            <div>
              {ticks.map(tick => <Tick key={tick.id} tick={tick} count={ticks.length} />)}
            </div>}
        </Ticks>
      </Slider>
      {!isReset && <div onClick={handleReset} className={s.clear}><FaTimes /></div>}
    </div>);
}

export default SliderComponent;
