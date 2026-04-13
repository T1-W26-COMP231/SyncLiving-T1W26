"use client";

import React from "react";

interface DualSliderProps {
  min: number;
  max: number;
  step?: number;
  valueMin: number;
  valueMax: number;
  onChangeMin: (v: number) => void;
  onChangeMax: (v: number) => void;
}

export function DualRangeSlider({
  min,
  max,
  step = 1,
  valueMin,
  valueMax,
  onChangeMin,
  onChangeMax,
}: DualSliderProps) {
  const thumbCls =
    "absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none " +
    "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 " +
    "[&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-dark [&::-webkit-slider-thumb]:border-2 " +
    "[&::-webkit-slider-thumb]:border-white [&::-webkit-slider-thumb]:shadow [&::-webkit-slider-thumb]:pointer-events-auto " +
    "[&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:rounded-full " +
    "[&::-moz-range-thumb]:bg-dark [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-white " +
    "[&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:border-solid";

  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  return (
    <div className="relative h-5 flex items-center">
      {/* Track */}
      <div className="absolute left-0 right-0 h-1 rounded bg-slate-200">
        <div
          className="absolute h-1 bg-primary rounded"
          style={{
            left: `${pct(valueMin)}%`,
            right: `${100 - pct(valueMax)}%`,
          }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valueMin}
        onChange={(e) =>
          onChangeMin(Math.min(Number(e.target.value), valueMax - step))
        }
        className={thumbCls}
      />
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={valueMax}
        onChange={(e) =>
          onChangeMax(Math.max(Number(e.target.value), valueMin + step))
        }
        className={thumbCls}
      />
    </div>
  );
}
