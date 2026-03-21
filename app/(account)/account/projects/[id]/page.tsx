/** Account: Project — страница одного проекта (коллекции) */
export default function AccountProjectPage({ params }: { params: { id: string } }) {
  return (
    <div>
      <h1>Проект #{params.id}</h1>
      <p>Товары в проекте, шаринг по ссылке</p>
    </div>
  );
}
