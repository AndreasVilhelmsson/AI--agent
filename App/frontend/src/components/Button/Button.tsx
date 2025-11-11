import React from "react";
import { ButtonStyled } from "./styled";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  type?: "button" | "submit" | "reset";
  buttonStyle?:
    | "is-secondary"
    | "is-outlined"
    | "is-text-only"
    | "is-icon-only"
    | "is-list-button";
  size?: "small" | "medium";
  disabled?: boolean;
  className?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>((p, ref) => {
  let classes = p.buttonStyle || "";
  if (p.className) classes += ` ${p.className} `;

  return (
    <ButtonStyled
      {...p}
      buttonStyle={p.buttonStyle}
      size={p.size}
      ref={ref}
      type={p.type || "button"}
      disabled={p.disabled}
      className={classes}
    >
      {p.children}
    </ButtonStyled>
  );
});

export default Button;
