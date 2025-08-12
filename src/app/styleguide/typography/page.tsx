// Местоположение: src/app/styleguide/typography/page.tsx
// Этот компонент будет использоваться как временная страница для демонстрации типографики.

import Logo from '@/components/icons/Logo'; // Импортируем, чтобы показать реальные иконки
import BurgerIcon from '@/components/icons/BurgerIcon';
import SearchIcon from '@/components/icons/SearchIcon';
import CloseIcon from '@/components/icons/CloseIcon';

export default function TypographyStyleGuidePage() {
  return (
    // НОВОЕ:
    // - Убираем `max-w-5xl` с главного контейнера на мобильных, чтобы он занимал всю доступную ширину.
    // - Добавляем `md:max-w-5xl` для ограничения ширины только на планшетах и ПК.
    // - Добавляем `py-12` и `mb-20` для отступов.
    // - `px-4` остается для базовых горизонтальных отступов.
    <div className="container mx-auto mb-20 px-4 py-12 md:max-w-5xl">
      {/* Заголовок страницы UI-Кита */}
      <h1 className="text-text-primary mb-12 text-center uppercase">
        UI-КИТ: ТИПОГРАФИКА
      </h1>

      {/* Раздел: Общая информация */}
      <section className="mb-16 border-b border-gray-200 pb-12">
        <h2 className="text-text-secondary mb-6">Обзор</h2>
        <p className="text-body-base text-text-primary mb-4 max-w-2xl">
          Этот раздел демонстрирует типографическую систему сайта Kyanchir. Мы
          используем два основных шрифта:{' '}
          <span className="font-heading font-bold">Unbounded</span> для
          заголовков и <span className="font-body font-medium">Manrope</span>{' '}
          для основного текста. Дополнительный шрифт{' '}
          <span className="font-mono">PT Mono</span> применяется для специальных
          элементов, таких как код.
        </p>
        <p className="text-body-base text-text-primary max-w-2xl">
          Все размеры шрифтов для заголовков H1-H3, параграфов и кнопок
          адаптируются автоматически с помощью CSS-функции{' '}
          <code className="font-mono">clamp()</code>, обеспечивая плавный
          переход между мобильными, планшетными и десктопными экранами. Жирность
          (<code className="font-mono">font-weight</code>) задана глобально для
          каждого уровня заголовка и основного текста.
        </p>
      </section>

      {/* Раздел: Заголовки (Шрифт: Unbounded) */}
      <section className="mb-16 border-b border-gray-200 pb-12">
        <h2 className="text-text-secondary mb-6">
          Заголовки (Шрифт: Unbounded)
        </h2>
        <p className="text-body-base text-text-primary mb-8 max-w-2xl">
          Шрифт <span className="font-heading font-bold">Unbounded</span>{' '}
          используется для всех заголовков H1-H6. Его размеры адаптивны (
          <code className="font-mono">clamp()</code>), а жирность задана для
          каждого уровня.
        </p>

        <div className="space-y-8">
          <div>
            <h3 className="text-text-primary mb-2">
              H1 (<code className="font-mono">font-weight: 900</code>)
            </h3>
            <h1 className="text-text-primary">Мир нежного белья</h1>
            <p className="text-body-sm mt-2 text-gray-500">
              <strong>Использование:</strong> Главный заголовок страницы,
              крупные блоки акций. <br />
              <strong>Размер:</strong> Адаптивный: от ~32px на моб. до ~96px на
              ПК.
            </p>
          </div>
          <div>
            <h3 className="text-text-primary mb-2">
              H2 (<code className="font-mono">font-weight: 800</code>)
            </h3>
            <h2 className="text-text-primary">Новая коллекция пижам</h2>
            <p className="text-body-sm mt-2 text-gray-500">
              <strong>Использование:</strong> Заголовки разделов на главной,
              название категории в каталоге. <br />
              <strong>Размер:</strong> Адаптивный: от ~28px на моб. до ~60px на
              ПК.
            </p>
          </div>
          <div>
            <h3 className="text-text-primary mb-2">
              H3 (<code className="font-mono">font-weight: 700</code>)
            </h3>
            <h3 className="text-text-primary">Выбор нижнего белья</h3>
            <p className="text-body-sm mt-2 text-gray-500">
              <strong>Использование:</strong> Подзаголовки внутри разделов,
              названия товаров в карточках, заголовки форм. <br />
              <strong>Размер:</strong> Адаптивный: от ~20.8px на моб. до ~40px
              на ПК.
            </p>
          </div>
          <div>
            <h3 className="text-text-primary mb-2">
              H4 (<code className="font-mono">font-weight: 600</code>,{' '}
              <code className="font-mono">text-2xl</code>)
            </h3>
            <h4 className="text-text-primary text-2xl">Кружевные комплекты</h4>
            <p className="text-body-sm mt-2 text-gray-500">
              <strong>Использование:</strong> Более мелкие заголовки, не
              управляемые <code className="font-mono">clamp()</code>, но
              требующие жирности Unbounded и стандартных размеров Tailwind.{' '}
              <br />
              <strong>Размер:</strong> Tailwind{' '}
              <code className="font-mono">text-2xl</code> (24px).
            </p>
          </div>
          <div>
            <h3 className="text-text-primary mb-2">
              H5 (<code className="font-mono">font-weight: 600</code>,{' '}
              <code className="font-mono">text-xl</code>)
            </h3>
            <h5 className="text-text-primary text-xl">Уход за шелком</h5>
            <p className="text-body-sm mt-2 text-gray-500">
              <strong>Использование:</strong> Меньшие заголовки. <br />
              <strong>Размер:</strong> Tailwind{' '}
              <code className="font-mono">text-xl</code> (20px).
            </p>
          </div>
          <div>
            <h3 className="text-text-primary mb-2">
              H6 (<code className="font-mono">font-weight: 600</code>,{' '}
              <code className="font-mono">text-lg</code>)
            </h3>
            <h6 className="text-text-primary text-lg">Размерная сетка</h6>
            <p className="text-body-sm mt-2 text-gray-500">
              <strong>Использование:</strong> Самые маленькие заголовки,
              например, в футере или боковых панелях. <br />
              <strong>Размер:</strong> Tailwind{' '}
              <code className="font-mono">text-lg</code> (18px).
            </p>
          </div>
        </div>
      </section>

      {/* Раздел: Основной текст (Шрифт: Manrope) */}
      <section className="mb-16 border-b border-gray-200 pb-12">
        <h2 className="text-text-secondary mb-6">
          Основной текст (Шрифт: Manrope)
        </h2>
        <p className="text-body-base text-text-primary mb-8 max-w-2xl">
          Шрифт <span className="font-body font-normal">Manrope</span>{' '}
          используется для всей основной массы текста. Его базовый размер
          адаптируется автоматически с помощью{' '}
          <code className="font-mono">clamp()</code> в{' '}
          <code className="font-mono">globals.css</code>. Для демонстрации
          других размеров и жирности используем стандартные классы Tailwind.
        </p>

        <div className="space-y-8">
          <div>
            <h3 className="text-text-primary mb-2">
              Стандартный параграф (<code className="font-mono"></code>,{' '}
              <code className="font-mono">font-weight: 400</code>)
            </h3>
            <p className="text-text-primary">
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do
              eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut
              enim ad minim veniam, quis nostrud exercitation ullamco laboris
              nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in
              reprehenderit in voluptate velit esse cillum dolore eu fugiat
              nulla pariatur. Excepteur sint occaecat cupidatat non proident,
              sunt in culpa qui officia deserunt mollit anim id est laborum.
            </p>
            <p className="text-body-sm mt-2 text-gray-500">
              <strong>Использование:</strong> Основная масса текста, описания
              товаров, статей, информация о компании. <br />
              <strong>Размер:</strong> Адаптивный: от ~16px на моб. до ~18px на
              ПК.
            </p>
          </div>

          <div>
            <h3 className="text-text-primary mb-2">
              Полужирный текст (<code className="font-mono">font-medium</code>)
            </h3>
            <p className="text-text-primary font-medium">
              <strong>Это полужирный текст Manrope.</strong> Используется для
              выделения важных частей предложения или кратких акцентов, когда не
              нужен полноценный заголовок.
            </p>
            <p className="text-body-sm mt-2 text-gray-500">
              Применяем класс <code className="font-mono">font-medium</code>{' '}
              (соответствует <code className="font-mono">font-weight: 500</code>
              ).
            </p>
          </div>

          <div>
            <h3 className="text-text-primary mb-2">
              Крупный текст (<code className="font-mono">text-lg</code>)
            </h3>
            <p className="text-text-primary text-lg">
              Используется для выделения важных абзацев или вступительного
              текста. Он чуть крупнее стандартного параграфа.
            </p>
            <p className="text-body-sm mt-2 text-gray-500">
              Применяем класс <code className="font-mono">text-lg</code>.
            </p>
          </div>

          <div>
            <h3 className="text-text-primary mb-2">
              Мелкий текст (<code className="font-mono">text-sm</code>,{' '}
              <code className="font-mono">font-light</code>)
            </h3>
            <p className="text-text-primary text-sm font-light">
              Используется для подписей к изображениям, мета-информации,
              дисклеймеров, или текста в футере. Мелкий и легкий для менее
              важного текста.
            </p>
            <p className="text-body-sm mt-2 text-gray-500">
              Применяем классы{' '}
              <code className="font-mono">text-sm font-light</code>.
            </p>
          </div>

          <div>
            <h3 className="text-text-primary mb-2">
              Очень мелкий текст (<code className="font-mono">text-xs</code>,{' '}
              <code className="font-mono">font-extralight</code>)
            </h3>
            <p className="text-text-primary text-xs font-extralight">
              Этот размер идеален для копирайтов в футере или очень тонких
              деталей, которые не должны отвлекать внимание.
            </p>
            <p className="text-body-sm mt-2 text-gray-500">
              Применяем классы{' '}
              <code className="font-mono">text-xs font-extralight</code>.
            </p>
          </div>
        </div>
      </section>

      {/* Раздел: Акцентный шрифт (PT Mono) */}
      <section className="mb-16 border-b border-gray-200 pb-12">
        <h2 className="text-text-secondary mb-6">Акцентный шрифт (PT Mono)</h2>
        <p className="text-body-base text-text-primary mb-8 max-w-2xl">
          Шрифт <span className="font-mono font-normal">PT Mono</span>{' '}
          используется для отображения кода, технических данных, уникальных
          идентификаторов или других элементов, где нужна моноширинность и
          четкость.
        </p>

        <div className="space-y-8">
          <div>
            <h3 className="text-text-primary mb-2">Базовый PT Mono</h3>
            <p className="text-text-primary text-body-base font-mono">
              <code className="font-mono">
                const productID = "KYNCHR-001-A1B2"
              </code>
            </p>
            <p className="text-body-sm mt-2 text-gray-500">
              Применяется через утилитарный класс Tailwind{' '}
              <code className="font-mono">font-mono</code>.
            </p>
          </div>
          <div>
            <h3 className="text-text-primary mb-2">PT Mono в мелком размере</h3>
            <p className="text-text-primary font-mono text-sm">
              <code className="font-mono">Код товара: #XY123-Z</code>
            </p>
            <p className="text-body-sm mt-2 text-gray-500">
              Применяем классы{' '}
              <code className="font-mono">font-mono text-sm</code>.
            </p>
          </div>
        </div>
      </section>

      {/* Раздел: Текст кнопок */}
      <section className="mb-16 border-b border-gray-200 pb-12">
        <h2 className="text-text-secondary mb-6">Текст кнопок</h2>
        <p className="text-body-base text-text-primary mb-8 max-w-2xl">
          Текст на кнопках использует шрифт Manrope с адаптивным размером и
          жирностью, заданными глобально для тега{' '}
          <code className="font-mono"></code>.
        </p>

        <div className="space-y-8">
          <div>
            <h3 className="text-text-primary mb-2">
              Основная кнопка (<code className="font-mono"></code>,{' '}
              <code className="font-mono">font-weight: 700</code>)
            </h3>
            <button className="bg-brand-lilac rounded-md px-6 py-3 text-white">
              Это кнопка
            </button>
            <p className="text-body-sm mt-2 text-gray-500">
              <strong>Использование:</strong> Основные призывы к действию.{' '}
              <br />
              <strong>Размер:</strong> Адаптивный: от ~16px на моб. до ~18px на
              ПК.
            </p>
          </div>
          {/* Можно добавить другие стили кнопок, если они появятся (например, outline, secondary) */}
        </div>
      </section>

      {/* Раздел: Комбинации и лучшие практики */}
      <section className="mb-16 border-b border-gray-200 pb-12">
        <h2 className="text-text-secondary mb-6">
          Классные связки и рекомендации
        </h2>
        <p className="text-body-base text-text-primary mb-8 max-w-2xl">
          Эффективная типографика — это не только правильные размеры, но и
          гармоничное сочетание разных стилей. Вот несколько примеров:
        </p>

        <div className="space-y-12">
          <div>
            <h3 className="text-text-primary mb-4">
              H2 + Параграф (вступление к разделу)
            </h3>
            <h2 className="text-text-primary">
              Наше нежное белье: комфорт и стиль
            </h2>
            <p className="text-text-primary max-w-prose">
              Мы создаем уникальные коллекции, чтобы каждая женщина чувствовала
              себя уверенно и комфортно. Используем только натуральные ткани и
              следим за каждой деталью.
            </p>
            <p className="text-body-sm mt-2 text-gray-500">
              <strong>Описание:</strong> Мощный заголовок Unbounded привлекает
              внимание, а текст Manrope легко читается. Идеально для начала
              нового раздела.
            </p>
          </div>

          <div>
            <h3 className="text-text-primary mb-4">
              H3 + Список (особенности продукта)
            </h3>
            <h3 className="text-text-primary">Особенности модели "Лотос"</h3>
            <ul className="text-text-primary text-body-base list-inside list-disc space-y-2">
              <li>Изготовлено из 100% натурального шелка Малбери.</li>
              <li>
                Гипоаллергенный материал, идеально для чувствительной кожи.
              </li>
              <li>Ручная вышивка из тончайших нитей.</li>
            </ul>
            <p className="text-body-sm mt-2 text-gray-500">
              <strong>Описание:</strong> Заголовок H3 четко обозначает тему, а
              список параграфов Manrope обеспечивает легкое чтение деталей.
            </p>
          </div>

          <div>
            <h3 className="text-text-primary mb-4">
              Цитата (крупный текст с акцентом)
            </h3>
            <p className="text-text-primary max-w-xl text-lg font-medium italic">
              “Самое главное в белье — это нежность прикосновения и чувство
              уверенности, которое оно дарит.”
            </p>
            <p className="text-body-sm mt-2 text-gray-500">
              <strong>Описание:</strong> Используем крупный параграф (
              <code className="font-mono">text-lg</code>) с полужирным
              начертанием (<code className="font-mono">font-medium</code>) и
              курсивом (<code className="font-mono">italic</code>) для выделения
              цитат или важных фраз.
            </p>
          </div>

          <div>
            <h3 className="text-text-primary mb-4">
              Код/техническая информация
            </h3>
            <p className="text-text-primary text-body-base font-mono">
              Ваш персональный код скидки:{' '}
              <span className="font-mono font-bold">XY-789-Z</span>
            </p>
            <p className="text-body-sm mt-2 text-gray-500">
              <strong>Описание:</strong> PT Mono отлично подходит для любых
              данных, которые должны выделяться как "технические" или "код".
            </p>
          </div>
        </div>
      </section>

      {/* Раздел: Иконки (для полноты UI-кита) */}
      <section>
        <h2 className="text-text-secondary mb-6">Иконки</h2>
        <p className="text-body-base text-text-primary mb-8">
          Цвет и размер иконок управляются через Tailwind классы. Базовый цвет
          для SVG задается классом{' '}
          <code className="font-mono">logo-brand-color</code> из{' '}
          <code className="font-mono">globals.css</code>, который также отвечает
          за эффекты <code className="font-mono">:hover</code> и{' '}
          <code className="font-mono">:active</code>.
        </p>
        <div className="flex items-center space-x-8">
          {/* Реальные SVG-компоненты иконок */}
          <div className="flex flex-col items-center">
            <Logo className="logo-brand-color h-10 w-auto" />
            <p className="text-body-sm mt-1 text-gray-500">Логотип (Header)</p>
          </div>
          <div className="flex flex-col items-center">
            <BurgerIcon className="logo-brand-color h-8 w-8" />
            <p className="text-body-sm mt-1 text-gray-500">Бургер (Mobile)</p>
          </div>
          <div className="flex flex-col items-center">
            <SearchIcon className="logo-brand-color h-8 w-8" />
            <p className="text-body-sm mt-1 text-gray-500">Поиск</p>
          </div>
          <div className="flex flex-col items-center">
            <CloseIcon className="logo-brand-color h-8 w-8" />
            <p className="text-body-sm mt-1 text-gray-500">Закрыть</p>
          </div>
        </div>
      </section>
    </div>
  );
}
