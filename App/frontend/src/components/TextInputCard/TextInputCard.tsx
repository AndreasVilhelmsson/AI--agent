export interface TextInputCardProps {
  title?: string;
  buttonStyle?: "primary" | "secondary";
  buttonContent?: string;
  children?: React.ReactNode;
  onClick?: () => void;
}
const TextInputCard: React.FC<TextInputCardProps> = () => {
  return (
    <div className="text-input-card">
      <input type="text" placeholder="Enter text" />
    </div>
  );
};
export default TextInputCard;
