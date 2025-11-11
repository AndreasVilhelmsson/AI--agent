export interface MeetingPageProps {
  props?: React.HtmlHTMLAttributes<HTMLDivElement>;
}
const MeetingPage: React.FC<MeetingPageProps> = ({ ...props }) => (
  <div {...props}>MeetingPage</div>
); // TODO: implement MeetingPage
export default MeetingPage;
