import * as RadixSlider from '@radix-ui/react-slider';

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min: number;
  max: number;
  step?: number;
  disabled?: boolean;
  /** Un libellé par pouce, dans l'ordre. */
  ariaLabels: string[];
}

/**
 * Habillage vintage de Radix Slider. Un pouce par entrée de `value` :
 * un tableau à une valeur donne un slider simple, à deux un double.
 */
export function Slider({
  value,
  onValueChange,
  min,
  max,
  step = 1,
  disabled = false,
  ariaLabels,
}: SliderProps) {
  return (
    <RadixSlider.Root
      className={`relative flex items-center select-none touch-none w-full h-11 ${
        disabled ? 'opacity-40 pointer-events-none' : ''
      }`}
      value={value}
      onValueChange={onValueChange}
      min={min}
      max={max}
      step={step}
      minStepsBetweenThumbs={value.length > 1 ? 1 : 0}
      disabled={disabled}
    >
      <RadixSlider.Track className="relative grow h-1.5 rounded-full bg-sepia-chaud/40">
        <RadixSlider.Range className="absolute h-full rounded-full bg-rouge-cinema" />
      </RadixSlider.Track>
      {value.map((_, index) => (
        <RadixSlider.Thumb
          key={index}
          aria-label={ariaLabels[index]}
          className="block w-6 h-6 rounded-full bg-creme-ecran border-2 border-bordeaux-profond shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-rouge-cinema focus-visible:ring-offset-2"
        />
      ))}
    </RadixSlider.Root>
  );
}
