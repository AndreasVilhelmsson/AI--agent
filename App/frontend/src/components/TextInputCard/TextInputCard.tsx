import React from "react";
import "./TextInputCard.scss";
export interface TextInputCardProps {
  title: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;

  primaryButtonLabel?: string;
  onPrimaryClick?: () => void;

  showClearButton?: boolean;
  onClear?: () => void;

  disabled?: boolean;
}

export const TextInputCard: React.FC<TextInputCardProps> = ({
  title,
  description,
  value,
  onChange,
  primaryButtonLabel = "Analyze",
  onPrimaryClick,
  showClearButton = false,
  onClear,
  disabled = false,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange(e.target.value);
  };

  const handleClear = () => {
    if (onClear) {
      onClear();
    }
  };

  const handlePrimaryClick = () => {
    if (onPrimaryClick) {
      onPrimaryClick();
    }
  };

  return (
    <section className="text-input-card">
      <header className="text-input-card__header">
        <h2 className="text-input-card__title">{title}</h2>
        {description && (
          <p className="text-input-card__description">{description}</p>
        )}
      </header>

      <div className="text-input-card__body">
        <textarea
          className="text-input-card__textarea"
          rows={15}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          placeholder="Paste your meeting notes here..."
        />
      </div>

      <footer className="text-input-card__footer">
        {showClearButton && onClear && (
          <button
            type="button"
            className="text-input-card__button text-input-card__button--secondary"
            onClick={handleClear}
            disabled={disabled || value.length === 0}
          >
            Clear
          </button>
        )}

        {onPrimaryClick && (
          <button
            type="button"
            className="text-input-card__button text-input-card__button--primary"
            onClick={handlePrimaryClick}
            disabled={disabled || value.length === 0}
          >
            {primaryButtonLabel}
          </button>
        )}
      </footer>
    </section>
  );
};
