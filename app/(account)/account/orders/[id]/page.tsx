/** Этап 4: Страница заказа */
export default function OrderPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Заказ #{params.id}</h1>
      <p>Таймлайн: Заказано → Оплачено → Получено</p>
    </div>
  );
}
