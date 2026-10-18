# El Museo en tu Bolsillo

Galería web que permite explorar la colección del Museo de Arte de Cleveland a través de su API.

## Funcionalidades:
- **Búsqueda**: por artista, tema o título.
- **Salas sugeridas**: botones con búsquedas preparadas (Monet, Impresionismo, Paisajes...). 
- **Estados visibles**: carga, error y búsqueda sin resultado.
- **Ordenación**: por relevancia, título o fecha, sin volver a pedir datos a la API.
- **Filtro**: por tipo de obra.
- **Ficha de la obra**: al pulsar una obra se abre una ventana con la imagen grande, la técnica, el departamento y la descripción.
- **Paginación**: se muestran 20 obras, y puedes cargar más con un botón.
- **Favoritos**: con el corazón de cada obra la guardas en tu colección, que se guarda en localStorage.
- **Collage**: con tus favoritos puedes crear un collage, mover las obras, cambiarles el tamaño sin deformarlas y ponerlas unas encima de otras. El collage se guarda en localStorage.
- **Caché en localStorage**: las búsquedas ya hechas no se vuelven a pedir a la red durante 24 horas, y se indica cuando los resultados vienen de la caché.
- **Imagen alternativa**: cuando no se puede cargar una imagen, aparece un aviso en su lugar.
- **Validación**: las búsquedas vacías no se envían y se muestra un aviso.
- **Modo oscuro**: se puede cambiar de modo oscuro a claro con un botón.

## Decisiones:
### Asincronía y manejo de errores
- Todas las peticiones usan 'async/await' dentro de un 'try/catch'.
- Se comprueba 'respuesta.ok', ya que 'fetch' no salta con errores HTTP.
- Si se lanza una búsqueda nueva mientras otra se está pidiendo, la petición antigua se cancela con 'AbortController'. Además, se comprueba que la respuesta corresponde a la búsqueda actual antes de mostrarla.
- Un fallo al pedir más obras no borra las que ya se muestran, sino que aparece un aviso y se puede volver a intentar.
- Cada petición tiene un tiempo máximo de 10 segundos con 'AbortSignal.timeout'.
- Las peticiones canceladas se reconocen como AbortError, y se ignoran porque no son un fallo.
- 'Cargar más' usa su propio 'AbortController', así que nunca cancela una búsqueda en curso.
- Los errores se traducen a mensaje comprensibles, y el error original se guarda en 'cause'.

### Transformación de datos
- Los datos de la API se convierten en 'Artwork' con 'flatMap', que descarta las obras sin imagen y transforma las demás. 
- La ordenación usa 'toSorted()' para no mutar el array original y poder volver al orden de relevancia.
- Los tipos únicos para el filtro y el número de artistas distintos se obtienen con un 'Set'.
- Los títulos y los tipos se ordenan con 'localeCompare(..., "es")' para que funcione con acentos y eñes.
- En el collage se usa 'Object.fromEntries' para guardar las posiciones, y otro 'reduce' para calcular qué obra está más arriba.
- Las obras se agrupan y se cuentan por tipo con reduce, para mostrar en el resumen el tipo más frecuente de esa busqueda.

### Robustez
- Si la respuesta no trae un array de obras, se trata como una búsqueda vacía para no romper la app.
- Las obras sin imagen se descartan, y si una imagen falla al cargar se sustituye por un aviso.
- Las obras repetidas entre páginas se descartan comparando sus 'id'.
- Si una obra no tiene descripción, se prueban varios campos distintos de la API.
- El acceso a 'localStorage' está protegido con un 'try/catch', por lo que si los datos guardados están corruptos o el almacenamiento está lleno, la app sigue funcionando sin guardar.
- Los favoritos y las posiciones del collage leídos de 'localStorage' se validan uno a uno, y los que no tienen el formato correcto se descartan.
- Si la respuesta no es JSON válido, se muestra un mensaje en vez de un error.
- Si falta algún elemento en el index.html, la app muestra un error que dice cuál falta.
- Los datos leídos de la caché también se validan, si no tiene la forma esperada, se ignora y se vuelve a pedir a la API.

### Seguridad
- Todo el contenido que llega de la API se inserta con 'textContent', nunca con 'innerHTML', para evitar ataques XSS.
- Algunas descripciones del museo traen HTML, y en vez de mostrarlo con 'innerHTML' se convierten en texto plano con 'DOMParser'.

### Caché, favoritos y collage
- Cada página de cada búsqueda se guarda con una clave propia y la fecha en que se guardó. Después de 24 horas caduca y se vuelve a pedir a la API.
- Solo se guardan las respuestas correctas y con obras. Los errores y las páginas vacías nunca llegan a la caché.
- Los favoritos se guardan enteros, con todos sus datos. Esto sirve para poder ver la colección sin conexión.
- En el collage se guardan la posición, el ancho y la capa de cada obra. La altura no hace falta, ya que se calcula sola con 'aspect-ratio' para que las obras no se deformen.
- La caché con caducidad (cache.ts) está separada del almacenamiento sin caducidad de favoritos, collage y tema (storage.ts), para que cada uno tenga una sola responsabilidad.

### Estilos
- Los colores están definidos como variables de CSS en ':root' y ':root.dark', así que cambiando unas pocas líneas cambia la paleta de toda la web.
- Las tarjetas se elevan con una transición al pasar el ratón por encima.
- La cabecera usa flexbox con 'justify-content: space-between' para colocar el título a la izquierda y el botón del tema a la derecha.



## Uso de IA:
Durante el proyecto he usado Claude como asistente para:
- Obtener un esqueleto inicial del código con la estructura del proyecto.
- Ayuda para añadir funcionalidades.
- Revisar y arreglar errores en el código.
- Reorganizar y simplificar el código.

Todo fue revisado y entendido por mí. Me apoyé en las DevTools para entender los errores y comprobar el funcionamiento de la app.