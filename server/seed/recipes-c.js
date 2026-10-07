// Catálogo pré-aprovado, lote C: pratos tradicionais do Brasil, com o Nordeste e
// o Norte no centro — as duas regiões que faltavam nos lotes A e B.
//
// ing: [nome, quantidade, unidade] e, opcionalmente, um 4º campo com os
// substitutos aceitos NAQUELE prato: o nome de um grupo de lib/food.js
// ('carne-seca', 'queijo-derrete') ou uma lista pronta (['Mussarela', 'Prato']).
// A categoria e os macros saem da tabela em lib/food.js.

export default [
  // ============================================================== NORDESTE
  { slug: 'carne-de-sol-macaxeira', name: 'Carne de Sol com Macaxeira', e: '🥩', d: 'O par que o sertão não separa', min: 60, serv: 4,
    tags: ['almoço', 'família', 'nordeste'],
    ing: [['Carne de Sol', 600, 'g', 'carne-seca'], ['Macaxeira', 800, 'g', 'raiz-cozida'], ['Manteiga de Garrafa', 30, 'ml', ['Manteiga', 'Óleo']], ['Cebola', 1, 'un'], ['Alho', 3, 'un']],
    steps: ['Se a carne estiver muito salgada, deixe de molho na água por 2 horas.', 'Cozinhe a macaxeira em água e sal até ficar macia por dentro.', 'Grelhe a carne em pedaços na manteiga de garrafa, com a cebola em rodelas.', 'Sirva a macaxeira ao lado, ainda quente.'] },

  { slug: 'moqueca-baiana', name: 'Moqueca Baiana', e: '🥘', d: 'Dendê, leite de coco e coentro na panela', min: 45, serv: 4,
    tags: ['almoço', 'família', 'nordeste', 'bahia'],
    ing: [['Peixe', 800, 'g', 'peixe-moqueca'], ['Leite de Coco', 400, 'ml'], ['Azeite de Dendê', 40, 'ml'], ['Tomate', 3, 'un'], ['Cebola', 2, 'un'], ['Pimentão', 1, 'un'], ['Coentro', 1, 'un', 'cheiro-verde'], ['Limão', 1, 'un'], ['Arroz', 300, 'g']],
    steps: ['Tempere as postas com limão, alho e sal e deixe descansar 20 minutos.', 'Monte a panela em camadas: cebola, tomate, pimentão e o peixe por cima.', 'Regue com o leite de coco e o dendê e cozinhe tampado por 20 minutos, sem mexer.', 'Jogue o coentro por cima no fim e sirva com arroz.'] },

  { slug: 'vatapa', name: 'Vatapá', e: '🍲', d: 'Cremoso, com camarão seco e castanha', min: 50, serv: 6,
    tags: ['almoço', 'família', 'nordeste', 'bahia'],
    ing: [['Pão de Forma', 8, 'un', ['Pão']], ['Leite de Coco', 400, 'ml'], ['Camarão Seco', 150, 'g'], ['Amendoim', 100, 'g'], ['Castanha de Caju', 100, 'g'], ['Azeite de Dendê', 50, 'ml'], ['Cebola', 1, 'un'], ['Gengibre', 10, 'g']],
    steps: ['Deixe o pão de molho no leite de coco até desmanchar.', 'Bata no liquidificador o camarão seco, o amendoim, a castanha, a cebola e o gengibre.', 'Leve tudo à panela e mexa em fogo baixo, sem parar, até engrossar.', 'Termine com o dendê e mexa mais 5 minutos.'] },

  { slug: 'caruru', name: 'Caruru', e: '🥘', d: 'Quiabo e camarão do jeito baiano', min: 45, serv: 6,
    tags: ['almoço', 'nordeste', 'bahia'],
    ing: [['Quiabo', 500, 'g'], ['Camarão Seco', 150, 'g'], ['Amendoim', 80, 'g'], ['Castanha de Caju', 80, 'g'], ['Azeite de Dendê', 40, 'ml'], ['Cebola', 1, 'un'], ['Coentro', 1, 'un', 'cheiro-verde']],
    steps: ['Lave e seque bem o quiabo antes de cortar: molhado, ele fica baboso.', 'Refogue a cebola no dendê e junte o quiabo em rodelas.', 'Acrescente o camarão seco, o amendoim e a castanha moídos.', 'Cozinhe 20 minutos mexendo de vez em quando.'] },

  { slug: 'acaraje', name: 'Acarajé', e: '🧆', d: 'Bolinho de feijão-fradinho frito no dendê', min: 90, serv: 6,
    tags: ['lanche', 'fim de semana', 'nordeste', 'bahia'],
    ing: [['Feijão-Fradinho', 500, 'g'], ['Cebola', 1, 'un'], ['Azeite de Dendê', 500, 'ml'], ['Camarão Seco', 100, 'g'], ['Sal', 5, 'g']],
    steps: ['Deixe o feijão de molho por 4 horas e esfregue para soltar as cascas.', 'Bata com a cebola até virar uma massa lisa e bata mais para dar ar.', 'Aqueça o dendê e frite às colheradas até dourar dos dois lados.', 'Abra ao meio e recheie com vatapá, caruru e camarão.'] },

  { slug: 'bobo-de-camarao', name: 'Bobó de Camarão', e: '🍤', d: 'Creme de mandioca com camarão', min: 60, serv: 4,
    tags: ['almoço', 'família', 'nordeste', 'bahia'],
    ing: [['Camarão', 600, 'g'], ['Mandioca', 700, 'g', 'raiz-cozida'], ['Leite de Coco', 400, 'ml'], ['Azeite de Dendê', 30, 'ml'], ['Tomate', 2, 'un'], ['Cebola', 1, 'un'], ['Coentro', 1, 'un', 'cheiro-verde'], ['Arroz', 300, 'g']],
    steps: ['Cozinhe a mandioca até desmanchar e bata com o leite de coco.', 'Refogue cebola, tomate e alho e junte os camarões só até ficarem rosados.', 'Misture o creme de mandioca e cozinhe 10 minutos.', 'Finalize com dendê e coentro e sirva com arroz.'] },

  { slug: 'escondidinho-carne-de-sol', name: 'Escondidinho de Carne de Sol', e: '🥧', d: 'Purê de macaxeira escondendo o melhor', min: 70, serv: 4,
    tags: ['jantar', 'família', 'conforto', 'nordeste'],
    ing: [['Carne de Sol', 500, 'g', 'carne-seca'], ['Macaxeira', 800, 'g', 'raiz-cozida'], ['Requeijão', 200, 'g', 'queijo-cremoso'], ['Queijo Coalho', 150, 'g', 'queijo-derrete'], ['Cebola', 1, 'un'], ['Manteiga', 30, 'g'], ['Leite', 100, 'ml']],
    steps: ['Cozinhe a macaxeira e amasse ainda quente com manteiga e leite.', 'Desfie a carne e refogue com cebola.', 'Monte: purê, carne, requeijão e mais purê.', 'Cubra com o queijo e leve ao forno até gratinar.'] },

  { slug: 'arrumadinho', name: 'Arrumadinho de Carne Seca', e: '🍛', d: 'Tudo em camadas, do jeito pernambucano', min: 45, serv: 4,
    tags: ['almoço', 'nordeste'],
    ing: [['Carne Seca', 400, 'g', 'carne-seca'], ['Feijão de Corda', 300, 'g', 'feijao-nordeste'], ['Farinha de Mandioca', 150, 'g', 'farinha-mesa'], ['Tomate', 2, 'un'], ['Cebola', 1, 'un'], ['Vinagre', 15, 'ml'], ['Cheiro Verde', 1, 'un', 'cheiro-verde']],
    steps: ['Dessalgue e cozinhe a carne, depois desfie e refogue.', 'Cozinhe o feijão de corda al dente.', 'Faça um vinagrete com tomate, cebola e vinagre.', 'Monte em camadas na travessa: feijão, carne, vinagrete e farofa por cima.'] },

  { slug: 'cuscuz-carne-de-sol', name: 'Cuscuz com Carne de Sol', e: '🌽', d: 'Café da manhã que aguenta o dia inteiro', min: 25, serv: 2,
    tags: ['café da manhã', 'nordeste'],
    ing: [['Flocão de Milho', 250, 'g', ['Cuscuz']], ['Carne de Sol', 300, 'g', 'carne-seca'], ['Queijo Coalho', 150, 'g', 'queijo-derrete'], ['Manteiga de Garrafa', 20, 'ml', ['Manteiga']], ['Cebola', 1, 'un']],
    steps: ['Umedeça o flocão com água e sal e deixe descansar 10 minutos.', 'Cozinhe na cuscuzeira por 12 minutos.', 'Refogue a carne desfiada com cebola na manteiga.', 'Sirva o cuscuz com a carne por cima e o queijo grelhado ao lado.'] },

  { slug: 'peixada-nordestina', name: 'Peixada Nordestina', e: '🐟', d: 'Peixe, legumes e caldo para molhar o pirão', min: 55, serv: 4,
    tags: ['almoço', 'família', 'nordeste'],
    ing: [['Peixe', 800, 'g', 'peixe-branco'], ['Batata', 400, 'g'], ['Cenoura', 2, 'un'], ['Pimentão', 1, 'un'], ['Tomate', 3, 'un'], ['Cebola', 2, 'un'], ['Leite de Coco', 200, 'ml'], ['Coentro', 1, 'un', 'cheiro-verde'], ['Ovo', 2, 'un']],
    steps: ['Tempere as postas com limão, alho e sal.', 'Faça uma cama de cebola, tomate e pimentão na panela larga.', 'Arrume o peixe e os legumes em cubos e cubra com água até a metade.', 'Cozinhe 25 minutos, junte o leite de coco e os ovos cozidos em rodelas.'] },

  { slug: 'pirao-de-peixe', name: 'Pirão de Peixe', e: '🥣', d: 'O caldo da peixada que vira prato', min: 15, serv: 4,
    tags: ['acompanhamento', 'aproveitamento', 'nordeste'],
    ing: [['Farinha de Mandioca', 150, 'g', 'farinha-mesa'], ['Peixe', 200, 'g', 'peixe-branco'], ['Cebola', 1, 'un'], ['Coentro', 1, 'un', 'cheiro-verde']],
    steps: ['Separe dois conchas do caldo quente do peixe.', 'Fora do fogo, vá jogando a farinha em chuva e mexendo sem parar.', 'Volte ao fogo baixo até engrossar, com o peixe desfiado dentro.'] },

  { slug: 'vaca-atolada', name: 'Vaca Atolada', e: '🍲', d: 'Costela e mandioca cozinhando juntas até desmanchar', min: 120, serv: 6,
    tags: ['fim de semana', 'família', 'conforto'],
    ing: [['Costela', 1000, 'g', 'carne-cozido'], ['Mandioca', 800, 'g', 'raiz-cozida'], ['Cebola', 1, 'un'], ['Alho', 4, 'un'], ['Tomate', 2, 'un'], ['Colorau', 5, 'g'], ['Cheiro Verde', 1, 'un', 'cheiro-verde']],
    steps: ['Doure a costela em pedaços na própria gordura.', 'Junte cebola, alho, tomate e colorau e refogue.', 'Cubra com água quente e cozinhe 1 hora até a carne soltar do osso.', 'Acrescente a mandioca e cozinhe até ela atolar o caldo.'] },

  { slug: 'galinhada', name: 'Galinhada', e: '🍛', d: 'Arroz e frango na mesma panela, amarelo de açafrão', min: 55, serv: 6,
    tags: ['almoço', 'família', 'econômico'],
    ing: [['Frango', 800, 'g', 'frango-pedaco'], ['Arroz', 400, 'g'], ['Açafrão-da-Terra', 5, 'g', ['Colorau', 'Cúrcuma']], ['Cebola', 1, 'un'], ['Alho', 4, 'un'], ['Pimentão', 1, 'un'], ['Cheiro Verde', 1, 'un', 'cheiro-verde']],
    steps: ['Tempere e doure os pedaços de frango na panela grande.', 'Refogue cebola, alho e pimentão na mesma gordura.', 'Junte o arroz, o açafrão e refogue mais um minuto.', 'Cubra com o dobro de água quente e cozinhe tampado por 20 minutos.'] },

  { slug: 'feijao-verde-coalho', name: 'Feijão Verde com Queijo Coalho', e: '🫘', d: 'Feijão novo, cremoso, com queijo derretendo', min: 40, serv: 4,
    tags: ['almoço', 'nordeste', 'vegetariano'],
    ing: [['Feijão Verde', 500, 'g', 'feijao-nordeste'], ['Queijo Coalho', 200, 'g', 'queijo-derrete'], ['Leite de Coco', 200, 'ml', 'leite-cremoso'], ['Cebola', 1, 'un'], ['Manteiga', 20, 'g'], ['Cheiro Verde', 1, 'un', 'cheiro-verde']],
    steps: ['Cozinhe o feijão verde em água e sal por 20 minutos.', 'Refogue a cebola na manteiga e junte o feijão escorrido.', 'Acrescente o leite de coco e deixe apurar.', 'Jogue o queijo em cubos no fim, só até começar a derreter.'] },

  { slug: 'macaxeira-frita', name: 'Macaxeira Frita', e: '🍟', d: 'Cozida antes, frita depois: o segredo é esse', min: 40, serv: 4,
    tags: ['acompanhamento', 'lanche'],
    ing: [['Macaxeira', 800, 'g', 'raiz-cozida'], ['Óleo', 500, 'ml', ['Azeite']], ['Sal', 5, 'g']],
    steps: ['Cozinhe a macaxeira em água e sal até espetar o garfo sem esforço.', 'Deixe esfriar e corte em bastões, tirando o fio do meio.', 'Frite em óleo quente até dourar e sale ainda quente.'] },

  { slug: 'bolinho-de-macaxeira', name: 'Bolinho de Macaxeira com Carne Seca', e: '🧆', d: 'O salgado que some da mesa primeiro', min: 60, serv: 6,
    tags: ['lanche', 'fim de semana', 'nordeste'],
    ing: [['Macaxeira', 600, 'g', 'raiz-cozida'], ['Carne Seca', 200, 'g', 'carne-seca'], ['Ovo', 1, 'un'], ['Farinha de Trigo', 100, 'g'], ['Óleo', 500, 'ml'], ['Cebola', 1, 'un']],
    steps: ['Cozinhe e amasse a macaxeira ainda quente.', 'Misture o ovo e a farinha até dar liga.', 'Refogue a carne desfiada com cebola e use como recheio.', 'Modele os bolinhos e frite até dourar.'] },

  { slug: 'pacoca-de-carne-de-sol', name: 'Paçoca de Carne de Sol', e: '🥩', d: 'Carne e farinha socadas juntas, comida de viagem', min: 40, serv: 4,
    tags: ['almoço', 'econômico', 'nordeste'],
    ing: [['Carne de Sol', 400, 'g', 'carne-seca'], ['Farinha de Mandioca', 200, 'g', 'farinha-mesa'], ['Cebola', 1, 'un'], ['Manteiga de Garrafa', 20, 'ml', ['Manteiga']]],
    steps: ['Cozinhe a carne dessalgada e desfie bem fina.', 'Frite a carne na manteiga com a cebola até secar.', 'Soque no pilão com a farinha, aos poucos, até virar uma farofa úmida.'] },

  { slug: 'queijo-coalho-mel', name: 'Queijo Coalho na Chapa com Mel', e: '🧀', d: 'Três minutos e a barraca de praia vem até você', min: 8, serv: 2,
    tags: ['lanche', 'rápido', 'nordeste'],
    ing: [['Queijo Coalho', 400, 'g'], ['Mel', 60, 'g', ['Melado', 'Geleia']], ['Orégano', 2, 'g']],
    steps: ['Aqueça bem a frigideira sem óleo.', 'Doure o queijo em espetos ou fatias grossas, virando uma vez.', 'Regue com mel e polvilhe orégano.'] },

  { slug: 'caldinho-de-feijao', name: 'Caldinho de Feijão', e: '🍜', d: 'O caldo que salva o fim de tarde', min: 30, serv: 4,
    tags: ['lanche', 'conforto'],
    ing: [['Feijão', 300, 'g'], ['Bacon', 100, 'g'], ['Linguiça Calabresa', 100, 'g', 'linguica'], ['Alho', 3, 'un'], ['Cebola', 1, 'un'], ['Cheiro Verde', 1, 'un', 'cheiro-verde']],
    steps: ['Bata o feijão cozido com o caldo no liquidificador e peneire.', 'Frite o bacon e a calabresa em cubinhos com alho e cebola.', 'Junte o feijão batido e ferva 10 minutos.', 'Sirva em copo, com cheiro verde por cima.'] },

  { slug: 'mungunza-doce', name: 'Mungunzá', e: '🥣', d: 'Canjica com coco e canela, cheiro de festa junina', min: 90, serv: 6,
    tags: ['doce', 'fim de semana', 'nordeste'],
    ing: [['Canjica', 400, 'g'], ['Leite', 800, 'ml'], ['Leite de Coco', 200, 'ml'], ['Açúcar', 150, 'g'], ['Canela', 3, 'g'], ['Cravo', 2, 'g'], ['Coco Ralado', 50, 'g']],
    steps: ['Deixe a canjica de molho na véspera.', 'Cozinhe na pressão por 40 minutos, até ficar macia.', 'Junte leite, leite de coco, açúcar, canela e cravo.', 'Ferva mexendo até engrossar e finalize com coco ralado.'] },

  { slug: 'cartola', name: 'Cartola', e: '🍌', d: 'Banana frita, queijo manteiga e canela', min: 15, serv: 2,
    tags: ['doce', 'rápido', 'nordeste'],
    ing: [['Banana', 4, 'un'], ['Queijo Manteiga', 200, 'g', ['Queijo Coalho', 'Mussarela']], ['Manteiga', 30, 'g'], ['Açúcar', 40, 'g'], ['Canela', 3, 'g']],
    steps: ['Frite as bananas na manteiga até dourarem dos dois lados.', 'Cubra com fatias de queijo e deixe derreter na frigideira tampada.', 'Polvilhe açúcar com canela por cima e sirva quente.'] },

  { slug: 'bolo-de-macaxeira', name: 'Bolo de Macaxeira', e: '🍰', d: 'Úmido, com coco, do liquidificador para o forno', min: 70, serv: 8,
    tags: ['doce', 'família', 'nordeste'],
    ing: [['Macaxeira', 800, 'g'], ['Coco Ralado', 100, 'g'], ['Leite de Coco', 200, 'ml'], ['Ovo', 3, 'un'], ['Açúcar', 200, 'g'], ['Manteiga', 50, 'g']],
    steps: ['Descasque e bata a macaxeira crua no liquidificador com o leite de coco.', 'Misture ovos, açúcar, manteiga derretida e o coco.', 'Despeje na forma untada e asse 50 minutos a 180 °C.'] },

  { slug: 'pamonha', name: 'Pamonha', e: '🌽', d: 'Milho verde amarrado na própria palha', min: 90, serv: 6,
    tags: ['doce', 'fim de semana'],
    ing: [['Milho Verde', 800, 'g'], ['Leite de Coco', 200, 'ml'], ['Açúcar', 150, 'g'], ['Manteiga', 30, 'g'], ['Sal', 3, 'g']],
    steps: ['Rale ou bata o milho e reserve as palhas inteiras.', 'Misture leite de coco, açúcar, manteiga e uma pitada de sal.', 'Monte as trouxinhas de palha e amarre bem.', 'Cozinhe em água fervente por 40 minutos.'] },

  { slug: 'curau', name: 'Curau de Milho', e: '🍮', d: 'Cremoso, com canela por cima', min: 40, serv: 6,
    tags: ['doce', 'família'],
    ing: [['Milho Verde', 800, 'g'], ['Leite', 500, 'ml'], ['Açúcar', 150, 'g'], ['Canela', 3, 'g']],
    steps: ['Bata o milho com o leite e passe pela peneira.', 'Leve ao fogo com o açúcar, mexendo sem parar até engrossar.', 'Distribua nas tigelas e polvilhe canela quando esfriar.'] },

  // ================================================================== NORTE
  { slug: 'tacaca', name: 'Tacacá', e: '🍲', d: 'Tucupi quente, goma e o jambu que treme a boca', min: 40, serv: 4,
    tags: ['lanche', 'norte', 'pará'],
    ing: [['Tucupi', 800, 'ml'], ['Goma de Tapioca', 100, 'g'], ['Camarão Seco', 100, 'g'], ['Jambu', 1, 'un'], ['Pimenta de Cheiro', 10, 'g'], ['Alho', 3, 'un']],
    steps: ['Ferva o tucupi com alho, pimenta e sal por 20 minutos.', 'Dissolva a goma em água fria e cozinhe até ficar transparente.', 'Escalde o jambu em água fervente por 3 minutos.', 'Na cuia: goma, tucupi quente, jambu e o camarão por cima.'] },

  { slug: 'pato-no-tucupi', name: 'Pato no Tucupi', e: '🦆', d: 'O prato mais paraense que existe', min: 180, serv: 6,
    tags: ['fim de semana', 'família', 'norte', 'pará'],
    ing: [['Pato', 1, 'un', ['Frango Inteiro']], ['Tucupi', 1000, 'ml'], ['Jambu', 2, 'un'], ['Alho', 6, 'un'], ['Limão', 2, 'un'], ['Arroz', 400, 'g'], ['Pimenta de Cheiro', 10, 'g']],
    steps: ['Tempere o pato com alho, limão e sal e deixe na geladeira por 2 horas.', 'Asse em pedaços até dourar bem.', 'Ferva o tucupi com alho e pimenta por 30 minutos.', 'Junte o pato ao tucupi, cozinhe 30 minutos e acrescente o jambu escaldado.', 'Sirva com arroz branco e farinha.'] },

  { slug: 'manicoba', name: 'Maniçoba', e: '🥘', d: 'A folha da mandioca cozinhando por dias', min: 240, serv: 8,
    tags: ['fim de semana', 'família', 'norte', 'pará'],
    ing: [['Maniva', 1000, 'g'], ['Carne Seca', 300, 'g', 'carne-seca'], ['Linguiça Calabresa', 200, 'g', 'linguica'], ['Bacon', 150, 'g'], ['Costelinha', 300, 'g', 'porco'], ['Alho', 4, 'un'], ['Arroz', 400, 'g']],
    steps: ['A maniva precisa ferver por vários dias antes de ser comida — compre-a já cozida.', 'Dessalgue as carnes e cozinhe cada uma separadamente.', 'Junte tudo na maniva e cozinhe mais 2 horas em fogo baixo.', 'Sirva com arroz e farinha d\'água.'] },

  { slug: 'x-caboquinho', name: 'X-Caboquinho', e: '🥪', d: 'Tucumã, queijo coalho e banana no pão', min: 12, serv: 1,
    tags: ['café da manhã', 'rápido', 'norte', 'amazonas'],
    ing: [['Pão', 1, 'un'], ['Tucumã', 80, 'g'], ['Queijo Coalho', 60, 'g', 'queijo-derrete'], ['Banana', 1, 'un'], ['Manteiga', 10, 'g']],
    steps: ['Abra o pão e passe manteiga na chapa.', 'Grelhe o queijo coalho e a banana em rodelas.', 'Monte com o tucumã em fatias finas e sirva com café.'] },

  { slug: 'acai-na-tigela', name: 'Açaí na Tigela', e: '🫐', d: 'Do jeito do Norte é salgado; aqui vai a versão da tigela', min: 10, serv: 2,
    tags: ['lanche', 'rápido', 'norte'],
    ing: [['Açaí', 400, 'g'], ['Banana', 2, 'un', 'fruta-vitamina'], ['Granola', 80, 'g', ['Aveia', 'Castanha de Caju']], ['Mel', 30, 'g']],
    steps: ['Bata a polpa de açaí congelada com metade da banana.', 'Sirva na tigela bem gelado.', 'Cubra com o resto da banana em rodelas, granola e mel.'] },

  { slug: 'caldeirada-de-tambaqui', name: 'Caldeirada de Tambaqui', e: '🐟', d: 'Peixe de rio com legumes num caldo generoso', min: 60, serv: 4,
    tags: ['almoço', 'família', 'norte', 'amazonas'],
    ing: [['Tambaqui', 1000, 'g', 'peixe-amazonia'], ['Batata', 400, 'g'], ['Tomate', 3, 'un'], ['Cebola', 2, 'un'], ['Pimentão', 1, 'un'], ['Leite de Coco', 200, 'ml'], ['Coentro', 1, 'un', 'cheiro-verde'], ['Limão', 1, 'un']],
    steps: ['Tempere as postas com limão, alho e sal.', 'Faça camadas de cebola, tomate, pimentão e batata na panela.', 'Coloque o peixe por cima e cubra com água até a metade.', 'Cozinhe 30 minutos, junte o leite de coco e o coentro.'] },

  { slug: 'pirarucu-de-casaca', name: 'Pirarucu de Casaca', e: '🐟', d: 'Camadas de peixe, banana frita e farofa', min: 80, serv: 6,
    tags: ['fim de semana', 'família', 'norte', 'amazonas'],
    ing: [['Pirarucu', 800, 'g', 'peixe-amazonia'], ['Banana', 4, 'un'], ['Farinha de Mandioca', 200, 'g', 'farinha-mesa'], ['Queijo Prato', 150, 'g', 'queijo-derrete'], ['Azeitona', 50, 'g'], ['Cebola', 2, 'un'], ['Tomate', 2, 'un'], ['Azeite', 40, 'ml']],
    steps: ['Dessalgue o pirarucu na véspera, trocando a água.', 'Refogue o peixe desfiado com cebola e tomate.', 'Frite as bananas em rodelas e faça uma farofa com o azeite.', 'Monte em camadas no refratário, cubra com queijo e gratine.'] },

  { slug: 'creme-de-cupuacu', name: 'Creme de Cupuaçu', e: '🥥', d: 'Ácido na medida, doce na medida', min: 15, serv: 4,
    tags: ['doce', 'rápido', 'norte'],
    ing: [['Cupuaçu', 500, 'g', ['Graviola', 'Maracujá', 'Açaí']], ['Leite Condensado', 395, 'g'], ['Creme de Leite', 200, 'ml', 'leite-cremoso']],
    steps: ['Bata a polpa com o leite condensado no liquidificador.', 'Junte o creme de leite e bata mais 30 segundos.', 'Leve à geladeira por 3 horas antes de servir.'] },

  { slug: 'tapioca-carne-de-sol', name: 'Tapioca de Carne de Sol', e: '🥞', d: 'A tapioca que vira jantar', min: 20, serv: 2,
    tags: ['jantar', 'rápido', 'nordeste'],
    ing: [['Goma de Tapioca', 200, 'g', ['Tapioca']], ['Carne de Sol', 200, 'g', 'carne-seca'], ['Queijo Coalho', 100, 'g', 'queijo-derrete'], ['Manteiga', 20, 'g'], ['Cebola', 1, 'un']],
    steps: ['Peneire a goma para ficar bem fina e solta.', 'Refogue a carne desfiada com cebola na manteiga.', 'Espalhe a goma na frigideira quente até firmar.', 'Recheie com a carne e o queijo e dobre ao meio.'] },

  // ======================================================= OUTROS CLÁSSICOS
  { slug: 'frango-com-quiabo', name: 'Frango com Quiabo', e: '🍗', d: 'Mineiro de carteirinha, com angu ao lado', min: 60, serv: 4,
    tags: ['almoço', 'família'],
    ing: [['Frango', 800, 'g', 'frango-pedaco'], ['Quiabo', 400, 'g'], ['Cebola', 1, 'un'], ['Alho', 4, 'un'], ['Tomate', 2, 'un'], ['Cheiro Verde', 1, 'un', 'cheiro-verde'], ['Óleo', 30, 'ml', 'gordura-refogar']],
    steps: ['Doure os pedaços de frango temperados.', 'Refogue cebola, alho e tomate e cozinhe o frango com água até amaciar.', 'Frite o quiabo em rodelas à parte, para não embabar.', 'Junte os dois e cozinhe mais 10 minutos.'] },

  { slug: 'tutu-de-feijao', name: 'Tutu de Feijão', e: '🫘', d: 'Feijão engrossado com farinha, couve ao lado', min: 45, serv: 4,
    tags: ['almoço', 'família', 'conforto'],
    ing: [['Feijão', 400, 'g'], ['Farinha de Mandioca', 150, 'g', 'farinha-mesa'], ['Bacon', 150, 'g'], ['Linguiça Calabresa', 200, 'g', 'linguica'], ['Alho', 4, 'un'], ['Cebola', 1, 'un'], ['Couve', 1, 'un']],
    steps: ['Bata o feijão cozido com o caldo e reserve.', 'Frite bacon e linguiça, junte alho e cebola.', 'Despeje o feijão batido e vá jogando a farinha em chuva, mexendo.', 'Sirva com couve refogada bem fina.'] },

  { slug: 'farofa-caseira', name: 'Farofa Caseira', e: '🌾', d: 'A que acompanha tudo', min: 20, serv: 6,
    tags: ['acompanhamento', 'rápido'],
    ing: [['Farinha de Mandioca', 250, 'g', 'farinha-mesa'], ['Bacon', 100, 'g'], ['Cebola', 1, 'un'], ['Ovo', 2, 'un'], ['Manteiga', 40, 'g'], ['Cheiro Verde', 1, 'un', 'cheiro-verde']],
    steps: ['Frite o bacon até soltar a gordura e reserve.', 'Refogue a cebola na manteiga e mexa os ovos ali mesmo.', 'Junte a farinha aos poucos, mexendo sempre para torrar por igual.', 'Volte o bacon e finalize com cheiro verde.'] },

  { slug: 'angu-carne-moida', name: 'Angu com Carne Moída', e: '🌽', d: 'Fubá cremoso com carne por cima', min: 45, serv: 4,
    tags: ['jantar', 'econômico', 'conforto'],
    ing: [['Fubá', 200, 'g'], ['Carne Moída', 500, 'g', 'carne-moida'], ['Molho de Tomate', 300, 'g', ['Extrato de Tomate', 'Tomate Pelado']], ['Cebola', 1, 'un'], ['Alho', 3, 'un'], ['Óleo', 20, 'ml', 'gordura-refogar']],
    steps: ['Dissolva o fubá em água fria antes de levar ao fogo — assim não empelota.', 'Cozinhe mexendo por 25 minutos até soltar da panela.', 'Refogue a carne com cebola, alho e o molho.', 'Sirva o angu no prato com a carne por cima.'] },

  { slug: 'bolo-de-fuba', name: 'Bolo de Fubá', e: '🍰', d: 'Do liquidificador, com erva-doce e café', min: 55, serv: 8,
    tags: ['doce', 'café da manhã', 'família'],
    ing: [['Fubá', 200, 'g'], ['Farinha de Trigo', 100, 'g'], ['Açúcar', 250, 'g'], ['Ovo', 3, 'un'], ['Leite', 300, 'ml'], ['Óleo', 120, 'ml'], ['Fermento em Pó', 10, 'g'], ['Erva-Doce', 5, 'g']],
    steps: ['Bata no liquidificador ovos, leite, óleo e açúcar.', 'Junte fubá e farinha e bata só até misturar.', 'Acrescente o fermento e a erva-doce mexendo com a colher.', 'Asse 40 minutos a 180 °C.'] },

  { slug: 'bolo-de-milho-cremoso', name: 'Bolo de Milho Cremoso', e: '🌽', d: 'Sem farinha, quase um pudim', min: 60, serv: 8,
    tags: ['doce', 'família'],
    ing: [['Milho Verde', 500, 'g'], ['Leite Condensado', 395, 'g'], ['Ovo', 3, 'un'], ['Coco Ralado', 50, 'g'], ['Manteiga', 50, 'g'], ['Fermento em Pó', 10, 'g']],
    steps: ['Bata o milho escorrido com o leite condensado e os ovos.', 'Junte a manteiga derretida e o coco.', 'Misture o fermento por último.', 'Asse 45 minutos a 180 °C, até firmar nas bordas.'] },

  { slug: 'pudim-de-leite', name: 'Pudim de Leite Condensado', e: '🍮', d: 'A sobremesa que não pode dar errado', min: 90, serv: 8,
    tags: ['doce', 'família', 'fim de semana'],
    ing: [['Leite Condensado', 395, 'g'], ['Leite', 400, 'ml'], ['Ovo', 3, 'un'], ['Açúcar', 200, 'g']],
    steps: ['Faça a calda derretendo o açúcar até dourar e forre a forma.', 'Bata leite condensado, leite e ovos no liquidificador.', 'Asse em banho-maria por 1 hora a 180 °C.', 'Espere esfriar e leve à geladeira antes de desenformar.'] },

  { slug: 'quindim', name: 'Quindim', e: '🟡', d: 'Gema, coco e açúcar: só isso', min: 60, serv: 6,
    tags: ['doce', 'fim de semana'],
    ing: [['Ovo', 6, 'un'], ['Açúcar', 250, 'g'], ['Coco Ralado', 100, 'g'], ['Manteiga', 30, 'g']],
    steps: ['Misture as gemas com o açúcar sem bater, para não fazer espuma.', 'Junte o coco e a manteiga derretida e descanse 30 minutos.', 'Asse em banho-maria por 40 minutos nas forminhas untadas.'] },

  { slug: 'romeu-e-julieta', name: 'Romeu e Julieta', e: '🧀', d: 'Duas fatias e pronto', min: 5, serv: 2,
    tags: ['doce', 'rápido', 'lanche'],
    ing: [['Goiabada', 200, 'g', ['Geleia', 'Doce de Leite']], ['Queijo Minas', 200, 'g', 'queijo-branco']],
    steps: ['Corte fatias iguais dos dois.', 'Sirva lado a lado — ou empilhados, se a discussão em casa for essa.'] },

  { slug: 'pao-de-alho', name: 'Pão de Alho', e: '🧄', d: 'O que abre o churrasco', min: 20, serv: 4,
    tags: ['acompanhamento', 'lanche', 'rápido'],
    ing: [['Pão', 4, 'un'], ['Manteiga', 100, 'g'], ['Alho', 6, 'un'], ['Requeijão', 100, 'g', 'queijo-cremoso'], ['Cheiro Verde', 1, 'un', 'cheiro-verde']],
    steps: ['Bata manteiga, alho, requeijão e cheiro verde até virar uma pasta.', 'Faça cortes no pão sem separar as fatias e recheie.', 'Leve à grelha ou ao forno até dourar.'] },

  { slug: 'vinagrete', name: 'Vinagrete', e: '🍅', d: 'Molho de churrasco, e de tudo mais', min: 10, serv: 6,
    tags: ['acompanhamento', 'rápido', 'vegetariano'],
    ing: [['Tomate', 3, 'un'], ['Cebola', 1, 'un'], ['Pimentão', 1, 'un'], ['Vinagre', 40, 'ml', ['Limão', 'Vinagre Balsâmico']], ['Azeite', 30, 'ml', 'gordura-refogar'], ['Cheiro Verde', 1, 'un', 'cheiro-verde']],
    steps: ['Pique tudo em cubos pequenos e iguais.', 'Tempere com vinagre, azeite e sal.', 'Deixe 20 minutos na geladeira antes de servir.'] },

  { slug: 'moqueca-capixaba', name: 'Moqueca Capixaba', e: '🥘', d: 'Sem dendê e sem leite de coco: só urucum e panela de barro', min: 45, serv: 4,
    tags: ['almoço', 'família', 'leve'],
    ing: [['Peixe', 800, 'g', 'peixe-moqueca'], ['Tomate', 4, 'un'], ['Cebola', 2, 'un'], ['Coentro', 1, 'un', 'cheiro-verde'], ['Urucum', 5, 'g', ['Colorau', 'Páprica']], ['Azeite', 40, 'ml'], ['Limão', 1, 'un'], ['Arroz', 300, 'g']],
    steps: ['Tempere o peixe com limão, alho e sal.', 'Na panela de barro, faça camadas de cebola, tomate e o peixe.', 'Regue com azeite e o urucum dissolvido e cozinhe tampado por 20 minutos.', 'Coentro por cima na hora de servir.'] },

  { slug: 'galinha-caipira-guisada', name: 'Galinha Caipira Guisada', e: '🐔', d: 'Cozimento longo, caldo grosso, domingo inteiro', min: 120, serv: 6,
    tags: ['fim de semana', 'família', 'conforto'],
    ing: [['Galinha Caipira', 1, 'un', ['Frango Inteiro']], ['Cebola', 2, 'un'], ['Alho', 5, 'un'], ['Tomate', 2, 'un'], ['Colorau', 5, 'g', ['Açafrão-da-Terra', 'Páprica']], ['Batata', 400, 'g'], ['Cheiro Verde', 1, 'un', 'cheiro-verde']],
    steps: ['Tempere a galinha em pedaços na véspera, com alho, sal e limão.', 'Doure bem os pedaços na panela de ferro.', 'Junte cebola, alho, tomate e colorau e cubra com água quente.', 'Cozinhe 1h30 em fogo baixo, acrescentando a batata na última meia hora.'] },

  { slug: 'baiao-de-dois-completo', name: 'Baião de Dois Completo', e: '🍛', d: 'Com queijo coalho e carne de sol, do jeito cearense', min: 70, serv: 6,
    tags: ['almoço', 'família', 'nordeste'],
    ing: [['Arroz', 300, 'g'], ['Feijão de Corda', 300, 'g', 'feijao-nordeste'], ['Carne de Sol', 400, 'g', 'carne-seca'], ['Queijo Coalho', 200, 'g', 'queijo-derrete'], ['Linguiça Calabresa', 150, 'g', 'linguica'], ['Cebola', 1, 'un'], ['Alho', 4, 'un'], ['Manteiga de Garrafa', 30, 'ml', ['Manteiga']], ['Cheiro Verde', 1, 'un', 'cheiro-verde']],
    steps: ['Cozinhe o feijão de corda guardando o caldo.', 'Refogue a carne dessalgada em cubos com a linguiça.', 'Junte o arroz, o feijão e o caldo e cozinhe até secar.', 'Misture o queijo em cubos e o cheiro verde com o fogo já desligado.'] },

  { slug: 'sarapatel-vegetariano', name: 'Feijoada Vegetariana', e: '🍲', d: 'O caldo escuro e a mesa cheia, sem carne nenhuma', min: 70, serv: 6,
    tags: ['almoço', 'vegetariano', 'família'],
    ing: [['Feijão Preto', 500, 'g', ['Feijão']], ['Abóbora', 300, 'g'], ['Batata Doce', 300, 'g'], ['Cenoura', 2, 'un'], ['Cebola', 2, 'un'], ['Alho', 5, 'un'], ['Louro', 2, 'g'], ['Couve', 1, 'un'], ['Arroz', 300, 'g'], ['Farinha de Mandioca', 100, 'g', 'farinha-mesa']],
    steps: ['Cozinhe o feijão preto com louro até ficar bem macio.', 'Refogue cebola e alho e junte parte do feijão amassado para engrossar.', 'Acrescente abóbora, batata doce e cenoura em cubos grandes.', 'Cozinhe 25 minutos e sirva com arroz, couve e farofa.'] },

  { slug: 'cocada-de-forno', name: 'Cocada de Forno', e: '🥥', d: 'Coco e leite condensado, quatro ingredientes', min: 40, serv: 8,
    tags: ['doce', 'rápido'],
    ing: [['Coco Ralado', 200, 'g'], ['Leite Condensado', 395, 'g'], ['Ovo', 2, 'un'], ['Manteiga', 30, 'g']],
    steps: ['Misture tudo numa tigela só.', 'Espalhe na forma untada.', 'Asse 30 minutos a 180 °C até dourar as bordas.'] },
];
