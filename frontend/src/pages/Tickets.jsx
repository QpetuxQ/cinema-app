import { Navigate, useParams } from "react-router-dom";

// Покупка билетов теперь живёт на главной странице.
// Старые ссылки /tickets/:id ведут туда с уже выбранным сеансом.
export default function Tickets() {
  const { id } = useParams();
  return <Navigate to={`/?session=${id}`} replace />;
}