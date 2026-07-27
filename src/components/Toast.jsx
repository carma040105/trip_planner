import { useTravel } from '../store/TravelContext.jsx';

export default function Toast() {
  const { toast } = useTravel();
  if (!toast) return null;
  return <div className="toast">{toast}</div>;
}
