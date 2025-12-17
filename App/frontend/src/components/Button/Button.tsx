import React from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  className,
  children,
  ...rest
}) => {
  const baseClass = "btn";
  const variantClass = `btn--${variant}`;
  const classes = [baseClass, variantClass, className]
    .filter(Boolean)
    .join(" ");

  return (
    <button className={classes} {...rest}>
      {children}
    </button>
  );
};

export default Button;
