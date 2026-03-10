/** Style Guide — типографика, цвета. Компоненты и отступы — далее. */
export default function StyleGuidePage() {
  return (
    <main style={{ padding: '40px 24px', maxWidth: 900, margin: '0 auto' }}>
      <h1 className="h1" style={{ marginBottom: 24 }}>Style Guide</h1>

      <section style={{ marginBottom: 48 }}>
        <h2 className="h3" style={{ marginBottom: 16 }}>Типографика</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <div>
            <p className="text-caption" style={{ color: 'var(--color-gray)', marginBottom: 4 }}>H1 — 40px, 400, uppercase (desktop)</p>
            <h1 className="h1">Заголовок первого уровня</h1>
          </div>
          <div>
            <p className="text-caption" style={{ color: 'var(--color-gray)', marginBottom: 4 }}>H2 — 32px, 450, uppercase</p>
            <h2 className="h2">Заголовок второго уровня</h2>
          </div>
          <div>
            <p className="text-caption" style={{ color: 'var(--color-gray)', marginBottom: 4 }}>H3 — 24px, 450, uppercase</p>
            <h3 className="h3">Заголовок третьего уровня</h3>
          </div>
          <div>
            <p className="text-caption" style={{ color: 'var(--color-gray)', marginBottom: 4 }}>H4 — 20px, 450, uppercase</p>
            <h4 className="h4">Заголовок четвёртого уровня</h4>
          </div>
          <div>
            <p className="text-caption" style={{ color: 'var(--color-gray)', marginBottom: 4 }}>H5 — 15px, 400/500, uppercase</p>
            <h5 className="h5">Заголовок пятого уровня</h5>
          </div>
          <div>
            <p className="text-caption" style={{ color: 'var(--color-gray)', marginBottom: 4 }}>Основной текст — 15px, 400</p>
            <p className="text-body">Основной текст для интерфейса и коротких блоков.</p>
          </div>
          <div>
            <p className="text-caption" style={{ color: 'var(--color-gray)', marginBottom: 4 }}>Основной длинный — 15px, 400, line-height 22</p>
            <p className="text-body-long">
              Длинный текст для статей и описаний. Межстрочный интервал 22px улучшает читаемость при большом объёме.
            </p>
          </div>
          <div>
            <p className="text-caption" style={{ color: 'var(--color-gray)', marginBottom: 4 }}>Подписи, плейсхолдеры, хлебные крошки — 14px, 400</p>
            <p className="text-caption">Подпись к полю · Плейсхолдер · Хлебные крошки</p>
          </div>
          <div>
            <p className="text-caption" style={{ color: 'var(--color-gray)', marginBottom: 4 }}>Карточки / статьи / табы / кнопки</p>
            <p className="text-card-20-400" style={{ marginBottom: 4 }}>Название 20px, 400</p>
            <p className="text-card-20-500" style={{ marginBottom: 4 }}>Название 20px, 500</p>
            <p className="text-card-16-500" style={{ marginBottom: 4 }}>Название 16px, 500</p>
            <p className="text-card-16-400">Название 16px, 400</p>
          </div>
        </div>
      </section>

      <section style={{ marginBottom: 48 }}>
        <h2 className="h3" style={{ marginBottom: 16 }}>Цвета</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16 }}>
          {[
            { name: 'Ink Black', var: 'var(--color-ink-black)', text: 'white' },
            { name: 'Black', var: 'var(--color-black)', text: 'white' },
            { name: 'White', var: 'var(--color-white)', text: 'black', border: '1px solid #eee' },
            { name: 'Gray', var: 'var(--color-gray)', text: 'white' },
            { name: 'Bright snow', var: 'var(--color-bright-snow)', text: 'black', border: '1px solid #eee' },
            { name: 'Red', var: 'var(--color-red)', text: 'white' },
          ].map((c) => (
            <div
              key={c.name}
              style={{
                width: 120,
                height: 80,
                backgroundColor: c.var,
                color: c.text === 'white' ? '#fff' : '#051826',
                border: c.border || 'none',
                borderRadius: 8,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 12,
              }}
            >
              <span style={{ fontWeight: 500 }}>{c.name}</span>
              <span style={{ opacity: 0.8 }}>{c.var}</span>
            </div>
          ))}
        </div>
      </section>

      <p className="text-caption" style={{ color: 'var(--color-gray)' }}>
        Далее в style-guide: отступы/сетка, кнопки, поля ввода, карточка товара, Header/Footer/Burger.
      </p>
    </main>
  );
}
