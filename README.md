# 🐈‍⬛ House Kats

**Gerenciador de Tarefinhas Adultas**: armário inteligente, receitas sincronizadas, controle de
líquidos, divisão de tarefas domésticas e uma praça onde a casa inteira aparece. Feito para rodar no
seu PC e ser usado pelo celular de cada integrante, na mesma Wi-Fi.

---

## Como rodar

**Jeito fácil:** dê dois cliques em **`Iniciar House Kats.bat`**. Ele instala o que falta na primeira
vez e sobe o app. **Deixe essa janela preta aberta**, pois é ela que serve o app. Fechou a janela, o app
sai do ar.

**Pelo terminal:**

```bash
npm install
```

```bash
npm start
```

O terminal mostra dois endereços:

```
  🏠  House Kats
  ├─ local     http://localhost:3777
  ├─ na Wi-Fi  http://192.168.x.x:3777
  ├─ receitas  80 no catálogo
  └─ servindo o app buildado
```

O endereço **na Wi-Fi** é o que todo mundo abre no celular. Dá para adicionar à tela inicial pelo
menu do navegador e usar como se fosse um app.

Durante o desenvolvimento, `npm run dev` sobe a API e o Vite com recarga automática (o front fica
em `http://localhost:5173`).

> O PC precisa estar ligado **e com a janela do servidor aberta** enquanto alguém usa o app, pois é ele
> que guarda os dados. Se a página não abrir (“não foi possível acessar esse site”), é quase sempre
> isso: o servidor não está rodando.

### Se der algum problema

| Sintoma | O que é |
|---|---|
| `ERR_CONNECTION_REFUSED` / a página não abre | O servidor não está rodando. Rode o `.bat` de novo. |
| Tela **“Não achei o servidor”** | Tem outro programa respondendo nessa porta. Feche o outro projeto e use o endereço que a janela preta mostra. |
| `A porta 3777 já está sendo usada` | Já tem uma janela do app aberta. Use aquela, ou rode com `set PORT=3778 && npm start`. |
| O celular não abre, mas o PC sim | Firewall do Windows bloqueando a porta 3777. Libere o Node.js na rede privada quando o Windows perguntar. |

> **Por que 3777 e não 3000?** A 3000 é o padrão de quase todo projeto Next.js/React. Se outro app
> seu já estiver nela, o House Kats não sobe, e o navegador acaba conversando com o app errado, que
> responde HTML no lugar de JSON. A porta 3777 evita essa briga. Se ainda assim der conflito, mude
> com `set PORT=3778 && npm start`.

---

## Senha da casa

O app não tem conta nem login por pessoa: dentro de casa, você entra tocando no seu
bichinho. Mas a casa inteira fica atrás de **uma senha só**, digitada **uma vez por
aparelho**. Sem ela, nenhuma tela abre e nenhuma rota da API responde.

Depois de acertar, o aparelho guarda um crachá que vale seis meses. Ele fica no banco,
então reiniciar o servidor não expulsa ninguém.

Criar e apagar casa pedem a senha **de novo**, na hora. Entrar no app é uma coisa;
apagar tudo é outra, e merece confirmação mesmo com o celular já destrancado.

### De onde vem a senha

Nesta ordem:

1. A variável **`HOUSEKATS_SENHA`**, que é o jeito certo em hospedagem.
2. O arquivo **`senha.txt`**, ao lado do banco (fora da pasta do projeto).
3. Nenhum dos dois? Na primeira vez o app **sorteia uma senha de seis dígitos**, salva
   no arquivo e mostra no terminal. Anote, porque ela só aparece uma vez.

```bash
set HOUSEKATS_SENHA=algumaCoisaSoSua && npm start
```

> **A senha nunca fica no repositório.** Nem no código, nem em arquivo versionado —
> ela mora junto do banco, na máquina que roda o app. Trocar é editar o `senha.txt`
> (ou definir a variável) e subir o servidor de novo.

Para expulsar todos os aparelhos de uma vez, apague as linhas da tabela `sessao`.

---

## Onde ficam os dados

Tudo num único arquivo SQLite, guardado **fora da pasta do projeto**, em
**`C:\Users\<você>\HouseKats\data\housekats.db`** (no Linux e no macOS, `~/HouseKats/data/`).

Para escolher outro lugar, defina `HOUSEKATS_DATA` antes de subir o app:

```bash
set HOUSEKATS_DATA=D:\meus-dados\housekats && npm start
```

**É um arquivo só, sempre.** O banco roda com journal de rollback (`journal_mode = DELETE`) em vez
de WAL, então depois de cada gravação o banco inteiro está nesse único arquivo. Fazer backup é
copiá-lo. Restaurar é colocá-lo de volta. Nada sai do seu computador.

> **Por que não WAL, e por que numa pasta tão sem graça?** O WAL é mais rápido, mas espalha o banco
> em três arquivos (`.db`, `.db-shm`, `.db-wal`) que só valem juntos: um dado já confirmado pode
> viver só no `.db-wal` até o checkpoint. Se alguém copiar, sincronizar, restaurar ou virtualizar
> esses arquivos em momentos diferentes, o SQLite descarta o WAL e some tudo que ainda não tinha ido
> para o arquivo principal. Aconteceu três vezes durante o desenvolvimento, em dois lugares
> diferentes:
>
> - **Junto do projeto.** OneDrive, Dropbox e iCloud copiam os três arquivos em momentos diferentes.
>   Este projeto mora na Área de Trabalho, que o OneDrive sincroniza.
> - **Dentro do `AppData`.** Aplicativos empacotados (MSIX/Store) redirecionam escritas em AppData
>   para o contêiner deles. O mesmo caminho passa a ter duas versões do arquivo, e cada processo
>   enxerga uma.
>
> A casa não precisa da concorrência que o WAL compra: são meia dúzia de escritas por minuto. Com
> arquivo único o problema deixa de existir, e a pasta simples no perfil evita os dois casos acima.
> Se mudar o caminho com `HOUSEKATS_DATA`, ainda assim evite pasta sincronizada.

---

## O que o app faz

### 🧊 Armário Inteligente

- **"Você tem comida para X refeições"**: cruza o estoque com as metas de cada integrante. Uma
  refeição de verdade precisa de proteína *e* carboidrato, então o total é limitado pelo que estiver
  mais escasso; o app diz qual é o gargalo. Logo abaixo, **quantos lanches, quantas comidas caseiras
  e quantas sobremesas** dá para fazer agora com o que tem, contando o livro de receitas da casa.
- **Adicionar** com nome (autocompletado), categoria, quantidade + unidade, origem
  (mercado / delivery / ganho / ajuste), preço opcional e para quem é o item. Dá para escolher se
  vai para a geladeira ou para o **congelador**, que estica bastante o prazo de validade.
- **Dar baixa** em vários itens de uma vez, com motivo (consumido / estragou / ajuste) e
  **quem consumiu**.
- **Confirmar ou contestar**: se alguém lançar um consumo no seu nome, você recebe um aviso ao
  entrar no app. Contestou? O app não abre discussão: divide meio a meio entre você e quem lançou.
  Quando o lançamento veio de um preparo, o aviso mostra **o prato**, não a lista de ingredientes
  (os ingredientes ficam a um toque, se você quiser conferir), e um único botão resolve a refeição
  inteira. Item solto, tipo um salgadinho, continua aparecendo um por um.
- **Validade estimada** por tipo de alimento, corrigível item a item.
- **Streak de alimentação**: conta dias seguidos comendo direito (2+ registros e entre 60% e 140%
  da meta). A régua premia constância, não perfeição.
- **Sobras**: o que sobrou da refeição vira um pote com prazo curto, conta como comida disponível
  na casa e avisa quando passou da hora de jogar fora.

### 📖 Receitas

- **Catálogo de 80 receitas brasileiras** embutido, com ingredientes, tempo, porções e macros
  calculados a partir dos próprios ingredientes.
- **Descoberta** estilo Tinder: 10 pratos por dia, por integrante. O app prioriza receitas cujos
  ingredientes já estão no seu armário. Curtiu, entra no livro da casa.
- **Livro de receitas**: notas de 1 a 5 (que pesam na lista de compras), contador de preparos e o
  selo 🏅 **Prato Conforto** para os 5 pratos com 10+ preparos. O top se reorganiza sozinho.
- **Cozinhar** dá baixa dos ingredientes no armário automaticamente, convertendo unidades
  (g ↔ kg, ml ↔ l) quando dá para fazer isso com segurança. Você marca **quem vai comer** e a
  receita se ajusta sozinha: dois à mesa gastam o dobro de ingredientes de um. Tem **＋ Visita**
  para as bocas sem perfil no app, clicável quantas vezes precisar: a receita cresce junto, mas o
  prato da visita não entra nos macros de ninguém. Se o armário não cobrir a mesa, o app avisa
  antes, item por item, dizendo quanto precisa e quanto tem.

### 🛒 Lista de compras

Gerada a partir do livro de receitas: você escolhe os dias, quem vai comer e alguns ajustes, e o app
monta um cardápio equilibrado (café da manhã, pratos principais e sobremesa em proporções sensatas),
soma os ingredientes, desconta o que já tem no armário e arredonda para quantidades que existem no
mercado. A lista fica em destaque enquanto estiver aberta, aceita edição, preços item a item, e ao
fechar joga o que foi marcado direto no armário.

Antes de sair de casa ela mostra um **orçamento estimado**, a partir de uma tabela de preços de
supermercado embutida (atualizada em setembro de 2026). Tendo pet na casa, a **ração entra na lista**
dimensionada por espécie, peso e apetite do bichinho.

### 🧹 Tarefinhas

Só destrava depois do armário, porque *sem energia não dá*. A preparação tem três passos:

1. **Cômodos da casa**, cada um já vindo com as tarefas típicas dele.
2. **Questionário colaborativo**: cada integrante estima tempo (em blocos de 5 minutos) e
   dificuldade de cada tarefa e cômodo. **Só libera quando todo mundo responder**, e o app usa a
   média da casa, não a opinião de um.
3. **Tarefa vetada**: cada um escolhe uma tarefa que não faz de jeito nenhum, e fica com o resto da
   casa em troca. Duas pessoas não podem vetar a mesma coisa. Quem já escolheu vê quem falta.

Depois disso:

- **Você não escolhe a tarefa, escolhe o tempo.** Diga "tenho 20 minutos" e o app monta a combinação
  ideal, priorizando o que está atrasado há mais tempo e evitando empilhar tudo no mesmo cômodo.
- **Estrelinhas** por tarefa (tempo × dificuldade), zeradas todo dia 1º.
- **Recompensa do mês**, escrita por vocês, sorteada, ou decidida em **votação** com três opções
  (empate alterna entre os empatados, para o mesmo gosto não ganhar sempre).
- **Calendário** com o que cada um fez, dia a dia, e também **o que ainda vai voltar**: as
  especiais que repetem aparecem na data de retorno, e dá para avançar os meses para planejar.
- **Tarefas especiais**: sua lista particular, fora da rotina (consertar o liquidificador e afins).
  Cada uma pode **repetir sozinha** no intervalo que você escolher — semanal, quinzenal, mensal, a
  cada dois meses, trimestral, semestral ou anual. Ao marcar como feita ela sai da lista e volta na
  data certa, mostrando quantos dias faltam; dá para trazer de volta antes com **Antecipar**. Sem
  repetição, some de vez, como sempre foi.

### 💧 Líquidos

Fica dentro do Armário, com a porcentagem do dia no próprio card. A meta de água sai do peso
(35 ml por quilo, entre 1,5 e 4 litros).

- **16 bebidas**, cada uma hidratando um tanto: água 100%, chá 98%, leite 87%, café 85%,
  cerveja 75%, vinho 50%, destilado 20%.
- **Café, álcool e bebida doce aumentam a meta** em vez de bloquear qualquer coisa. Uma lata de
  cerveja ainda conta como hidratação, e ao mesmo tempo soma água extra ao que falta beber.
- **Beber do armário** dá baixa no estoque de verdade e conta como consumo, igual a qualquer
  outro alimento.
- **Avisos simpáticos** ao passar de 1 litro de café ou de álcool por semana. Não bloqueiam nada e
  não cobram nada: só contam o que aconteceu e deixam a decisão com você.
- Quantidades por copo (200 ml), caneca (300 ml), garrafinha (500 ml) e garrafão (1 L), gráfico da
  semana e de onde veio a sua hidratação.

### 🏞️ Praça

O lado social da casa, em vista aérea. O emoji de cada integrante fica perambulando pelo gramado e
soltando falas que saem do que realmente aconteceu por aí.

- **Os bichinhos não têm necessidades** e nada aqui pode dar errado. Não é bichinho virtual de
  cuidar, é termômetro: quem está de bom humor anda mais rápido, quem está pra baixo anda devagar.
- **As falas vêm da casa de verdade**: streak de alimentação, tarefa feita hoje, quem ainda não
  comeu, o que está quase vencendo, a última receita preparada, quem lidera as estrelinhas do mês,
  quem viajou. Pet fala conforme a espécie, e visita comenta que está de passagem.
- **Moedas** são a economia da praça: 2 por dia comendo direito, 2 por bater a meta de água, 1 por
  receita feita, 1 por manter a sequência e 0,5 por estrelinha de tarefa. O cofre é coletivo, e
  quem tem mais é quem paga primeiro, para ninguém ficar negativo.
- **Loja**: 12 enfeites para o mapa (banco, árvore, fonte, quiosque, churrasqueira…) e 9 **fundos**
  que repintam o gramado e o calçadão. O gramado vem de graça; trocar entre os que a casa já comprou
  não custa nada.
- **Jogar petisco**: escolha um emoji ou um prato do livro e cada um reage conforme a nota que deu
  para ele. É só carinho — **não sai do armário e não conta como consumo de ninguém**.
- **Sugestão de carinho**: quando alguém **marca** que está num dia ruim, o app sugere o prato
  favorito dessa pessoa. É só o aviso, sem botão: quem quiser cozinhar vai pelo livro de receitas.
  Quem não marcou humor nenhum fica neutro, e o app não deduz que alguém está mal.

### 🐾 Pets e visitas

O cadastro de integrante começa perguntando quem está entrando:

| Tipo | Come | Faz tarefa | Entra na praça | Some depois |
|---|---|---|---|---|
| 🏠 **Morador** | sim | sim | sim | não |
| 🧳 **Visita** | sim | sim | sim | no fim do prazo, se a casa quiser |
| 🐾 **Pet** | sim | **não** | sim | não |

- **Pet** tem avatares e sete espécies próprias (cachorro, gato, pássaro, roedor, peixe, réptil e
  outro), fica
  fora do questionário e do placar de estrelinhas, e não é perfil de acesso: ninguém entra no app
  como o pet. A **categoria Pet** só aparece no armário se a casa tiver algum, e a ração entra na
  lista de compras pela espécie e pelo porte.
- **Visita** participa de tudo normalmente enquanto está aí, com prazo definido na entrada. Quando o
  prazo acaba, **quem mora na casa** decide: apagar os dados, estender mais uns dias, ou efetivar
  como morador. Nada é apagado sem alguém escolher, e a própria visita não decide isso.

### 📊 Padrões

Gasto por mês e por categoria, **mercado contra delivery**, o que sempre entra na sacola, o que
costuma estragar, os pratos que vocês repetem, as melhores notas e o resumo por integrante. Tudo
calculado do histórico real de movimentos. Nada é inventado, e preço só aparece onde alguém anotou.

### ✈️ Modo Viagem

Diga quantos dias vocês ficam fora e o app separa o armário em *come antes de sair*, *manda pro
congelador* e *doa*, com baixa em lote. Enquanto durar, **as streaks de alimentação ficam congeladas
e as tarefas param de acumular atraso**. Ninguém perde nada por não estar em casa.

### 📜 Log da casa

Tudo que acontece vira uma linha simples, agrupada por dia. Fica no fim dos **Padrões**.

---

## 🧪 Modo demonstração

Na tela inicial (ou em **Gerenciar → Modo demonstração**) dá para criar uma casa de exemplo já
preenchida, em três níveis:

| Perfil | Pessoas | Histórico | O que tem |
|---|---|---|---|
| 🧍 **1 pessoa** | 1 | 30 dias | Dados médios: armário cheio, 12 receitas, 1 Prato Conforto |
| 👥 **2 pessoas** | 2 | 8 dias | Dados de iniciante: pouco histórico, livro pequeno, lista aberta |
| 👨‍👩‍👧‍👦 **4 pessoas** | 4 | 120 dias | Dados avançados: meses de gastos, 3 Pratos Conforto, disputa de estrelinhas |

As casas de exemplo aparecem com **(demo)** no nome e podem ser apagadas de uma vez pelo mesmo menu.

---

## Estrutura

```
server/
├── index.js            Express: monta as rotas e serve o app buildado
├── db.js               SQLite (node:sqlite): schema, migrações leves e helpers
├── lib/
│   ├── food.js         Tabela de alimentos: macros, durabilidade, unidades, conversões
│   ├── nutrition.js    Metas estimadas por integrante (dieta + objetivo)
│   ├── fridge.js       Estoque, movimentos, refeições disponíveis, streaks
│   ├── pantryExtras.js Sobras e congelador
│   ├── hydration.js    Bebidas, meta de água, dívida do café e do álcool, avisos
│   ├── plaza.js        Praça: bichinhos, falas, moedas, enfeites e fundos
│   ├── chores.js       Médias do questionário, estrelinhas, motor de "tenho X minutos"
│   ├── insights.js     Padrões de gasto e de gosto, plano do Modo Viagem
│   ├── prices.js       Tabela de preços de mercado para o orçamento da lista
│   ├── travel.js       Períodos congelados (isolado para fridge e chores usarem)
│   └── fun.js          Títulos, cores, avatares, espécies de pet e recompensas
├── routes/             Uma rota por domínio
└── seed/
    ├── recipes-a.js    Catálogo, lote A (40 receitas)
    ├── recipes-b.js    Catálogo, lote B (40 receitas)
    ├── chores.js       Cômodos e tarefas modelo
    └── demo.js         Gerador das casas de exemplo

src/
├── lib/                Cliente da API (tipado) e estado global
├── components/         Sheet, modais, formulário de integrante, UI base
└── screens/            Uma tela por área do app
```

---

## Detalhes que valem saber

- **Cor por pessoa.** Cada integrante escolhe a sua e o app inteiro muda de cor para ele. É uma
  variável CSS trocada quando o usuário entra.
- **Humor do dia.** No Perfil dá para marcar como você está, com histórico. É o que muda o ânimo do
  seu bichinho na Praça e o que dispara a sugestão de carinho para a casa.
- **Calorias na mão.** Se a estimativa do app não bater com a sua realidade, dá para fixar a meta
  diária no Perfil; os macros se reajustam em cima do número que você escolheu.
- **Sem senha.** É uma casa, não um banco: você entra tocando no seu bichinho. O dispositivo lembra
  quem foi o último a usar.
- **Nutrientes são estimativas.** As metas saem de uma fórmula pública (Mifflin-St Jeor) e a tabela
  de alimentos usa valores aproximados de uso doméstico. Serve para gamificação e planejamento, mas
  **não substitui orientação de nutricionista ou médico.**
- **`node:sqlite`** é usado direto do Node (24+), sem dependência nativa, então não precisa compilar nada no
  Windows.

---

## Ainda não tem

- **Leitura de nota fiscal** (foto ou texto colado). Foi deixada de fora de propósito; a estrutura de
  movimentos já suporta importação em lote quando você quiser.
- **Acesso de fora de casa.** A camada de dados está isolada em `server/lib`, então plugar um backend
  na nuvem depois não exige reescrever as telas.
