interface StarRatingProps {
  rating: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}

const sizeClasses = { sm: 'text-sm', md: 'text-lg', lg: 'text-2xl' };

export default function StarRating({
  rating,
  max = 5,
  size = 'md',
  interactive = false,
  onChange,
}: StarRatingProps) {
  return (
    <span className={`inline-flex ${sizeClasses[size]}`}>
      {Array.from({ length: max }, (_, i) => {
        const filled = i < Math.round(rating);
        return (
          <span
            key={i}
            className={`${filled ? 'text-yellow-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer' : ''}`}
            onClick={interactive && onChange ? () => onChange(i + 1) : undefined}
          >
            ★
          </span>
        );
      })}
    </span>
  );
}
