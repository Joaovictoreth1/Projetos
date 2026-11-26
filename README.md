# Projetos

Seis utilitários independentes para o navegador, em português do Brasil. O site usa HTML, CSS e JavaScript nativo: não há servidor de aplicação, banco de dados, API, contas ou dependências de produção.

## Aplicativos

| Aplicativo                                     | Como usar                                                                                                                                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Calculadora](01_calculadora_simples.html)     | Clique nos botões ou digite uma expressão (por exemplo, `-2+3*4`). Use Enter ou `=` para calcular, Backspace para apagar e Escape para limpar.                                                          |
| [Lista de tarefas](02_lista_de_tarefas.html)   | Adicione, conclua e exclua tarefas. As alterações são salvas no navegador atual, na mesma origem; não há sincronização. Se o armazenamento estiver bloqueado, a lista funciona apenas na página aberta. |
| [Relógio digital](03_rel_gio_digital.html)     | Mostra hora e data no fuso horário do dispositivo e atualiza a cada virada de segundo.                                                                                                                  |
| [Gerador de senhas](04_gerador_de_senhas.html) | Escolha de 6 a 30 caracteres e pelo menos uma categoria. Gere a senha e clique em **Copiar**. Se o navegador bloquear o acesso à área de transferência, selecione o texto e copie manualmente.          |
| [Jogo da velha](05_jogo_da_velha.html)         | Dois jogadores alternam entre X e O. A partida termina quando alguém vence ou o tabuleiro enche; o botão **Reiniciar Jogo** começa uma nova partida.                                                    |
| [Cronômetro](06_cronometro.html)               | Use **Iniciar**, **Pausar** e **Zerar**. A tela mostra horas, minutos e segundos; continuar preserva o tempo acumulado.                                                                                 |

## Arquitetura

`index.html` liga aos seis endereços originais. Cada aplicativo tem um `style.css`, um módulo `main.js` que conecta a interface ao navegador e um `logic.js` com regras independentes do DOM. O cronômetro usa um relógio monotônico (`performance.now()`) em vez de contar disparos de um temporizador. Horários e tarefas são locais ao dispositivo.

## Desenvolvimento

Requisitos: Node.js 24 LTS (24.8 ou posterior; Node.js 22.22+ também é aceito na linha 22) e npm. Não há variáveis de ambiente obrigatórias nem arquivo `.env`. Use um servidor HTTP local, não `file://`, para carregar os módulos.

```sh
npm ci
npm run serve
```

Abra <http://127.0.0.1:4173/>. O comando cria `dist/` e serve somente os arquivos públicos com os cabeçalhos de produção. Reinicie-o após editar arquivos para atualizar a prévia.

| Comando                                                | Finalidade                                                                                                                               |
| ------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run format` / `npm run format:check`              | Formata ou verifica com Prettier.                                                                                                        |
| `npm run lint` / `npm run lint:html`                   | Verifica JavaScript com ESLint e HTML com html-validate.                                                                                 |
| `npm run typecheck`                                    | Verifica os módulos JavaScript com TypeScript em modo estrito (JSDoc).                                                                   |
| `npm test` / `npm run test:coverage`                   | Executa testes de lógica e DOM (Vitest/jsdom) e, opcionalmente, mede cobertura. Exige 95% de linhas e ramificações por módulo de lógica. |
| `npx playwright install chromium` e `npm run test:e2e` | Executa os fluxos reais dos seis aplicativos e verifica cabeçalhos, erros do navegador e telas estreitas.                                |
| `npm run build`                                        | Gera os arquivos para publicação em `dist/`.                                                                                             |
| `npm audit`                                            | Audita as dependências de desenvolvimento.                                                                                               |

O Makefile também oferece `make install`, `make lint`, `make test`, `make e2e` e `make serve`. O GitHub Actions executa as verificações, a auditoria, a montagem e os testes em Chromium a cada push e pull request.

## Segurança e publicação

- Nenhuma página precisa de scripts, estilos ou serviços externos. O build confere se a política CSP no HTML é igual à política de cabeçalho (exceto a regra de enquadramento, que só funciona por cabeçalho).
- A calculadora interpreta apenas números e operações aritméticas; não executa entrada como código. A lista insere tarefas como texto, não como HTML.
- As senhas são geradas com Web Crypto (`crypto.getRandomValues`), amostragem por rejeição e embaralhamento. O site não envia nem salva as senhas. A cópia exige um contexto seguro (HTTPS ou localhost) e aprovação do navegador.
- Em produção, execute `npm ci && npm run build` e publique **apenas `dist/`**, com HTTPS. Netlify e Cloudflare Pages aplicam `dist/_headers`. No GitHub Pages, publique `dist/` como artefato do seu fluxo de Pages: a CSP embutida e a política de referência continuam ativas, mas o Pages não lê `_headers` (incluindo a proteção contra enquadramento). Para exigir todos os cabeçalhos, use uma hospedagem que os configure.
