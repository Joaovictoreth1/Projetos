# Projetos de JavaScript

Seis exercícios independentes: calculadora, tarefas, relógio digital, gerador de senhas, jogo da velha e cronômetro. O gerador usa Web Crypto; para copiar, use localhost ou HTTPS.

## Rodar localmente

Na raiz do repositório, execute:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Abra <http://localhost:8000/>.

## Estrutura

`index.html`: lista dos exercícios. `01_*.html` a `06_*.html`: páginas. `exercises.mjs` e `exercises.test.mjs`: lógica compartilhada e testes (`node --test`, Node 24).

A CI valida o HTML e verifica arquivos e âncoras locais. Links e serviços externos não são consultados pela CI.
