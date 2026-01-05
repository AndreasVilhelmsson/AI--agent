import "./ActionItemList.scss";

type ActionItem = {
  task: string;
  owner?: string | null;
  dueDate?: string | null;
  context?: string | null;
};

type Props = {
  items: ActionItem[];
};

export const ActionItemList: React.FC<Props> = ({ items }) => {
  if (!items.length) {
    return <p className="muted">No action items.</p>;
  }

  return (
    <div className="action-item-list">
      {items.map((a, i) => (
        <div key={i} className="action-item">
          <div className="action-item__task">{a.task}</div>
          {(a.owner || a.dueDate) && (
            <div className="action-item__meta">
              {a.owner && <>Owner: {a.owner}</>}
              {a.owner && a.dueDate && " · "}
              {a.dueDate && <>Due: {a.dueDate}</>}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};
