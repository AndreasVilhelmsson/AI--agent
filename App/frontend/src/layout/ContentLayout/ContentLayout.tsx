import "./ContentLayout.scss";

export const ContentLayout: React.FC<{
  left: React.ReactNode;
  right: React.ReactNode;
}> = ({ left, right }) => {
  return (
    <div className="content-layout">
      <div className="content-layout__left">{left}</div>
      <div className="content-layout__right">{right}</div>
    </div>
  );
};
