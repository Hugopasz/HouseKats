// Catálogo pré-aprovado, lote B (mais variedade: lanches, doces, vegetarianos, marmita).

export default [
  { slug: 'pao-de-queijo', name: 'Pão de Queijo', e: '🧀', d: 'Sai do forno e some da mesa', min: 40, serv: 5,
    tags: ['lanche', 'café da manhã'],
    ing: [['Tapioca', 500, 'g'], ['Queijo Minas', 250, 'g'], ['Ovo', 2, 'un'], ['Leite', 200, 'ml'], ['Óleo', 80, 'ml']],
    steps: ['Escalde o polvilho com leite e óleo quentes.', 'Misture ovos e queijo.', 'Enrole e asse 25 min a 200 °C.'] },

  { slug: 'bolo-cenoura', name: 'Bolo de Cenoura', e: '🍰', d: 'Com cobertura de chocolate, obviamente', min: 55, serv: 8,
    tags: ['doce', 'fim de semana'],
    ing: [['Cenoura', 3, 'un'], ['Ovo', 3, 'un'], ['Açúcar', 300, 'g'], ['Farinha de Trigo', 300, 'g'], ['Óleo', 150, 'ml'], ['Chocolate', 100, 'g']],
    steps: ['Bata cenoura, ovos, óleo e açúcar no liquidificador.', 'Misture a farinha e o fermento.', 'Asse 40 min a 180 °C e cubra com chocolate.'] },

  { slug: 'brigadeiro-panela', name: 'Brigadeiro de Panela', e: '🍫', d: 'Colher direto da panela conta como porção', min: 15, serv: 6,
    tags: ['doce', 'rápido'],
    ing: [['Creme de Leite', 200, 'ml'], ['Chocolate', 150, 'g'], ['Manteiga', 20, 'g'], ['Açúcar', 100, 'g']],
    steps: ['Leve tudo ao fogo baixo mexendo sempre.', 'Cozinhe até desgrudar do fundo.'] },

  { slug: 'salada-caprese', name: 'Salada Caprese', e: '🍅', d: 'Três ingredientes bons bastam', min: 10, serv: 2,
    tags: ['leve', 'rápido'],
    ing: [['Tomate', 3, 'un'], ['Mussarela', 200, 'g'], ['Azeite', 30, 'ml']],
    steps: ['Fatie tomate e queijo.', 'Intercale, regue com azeite e sal.'] },

  { slug: 'hamburguer-caseiro', name: 'Hambúrguer Caseiro', e: '🍔', d: 'Melhor que qualquer entrega', min: 30, serv: 3,
    tags: ['jantar', 'fim de semana'],
    ing: [['Carne Moída', 500, 'g'], ['Pão', 3, 'un'], ['Mussarela', 120, 'g'], ['Cebola', 1, 'un'], ['Tomate', 1, 'un'], ['Alface', 1, 'un']],
    steps: ['Molde os discos sem apertar demais.', 'Sele em frigideira bem quente, 2 min de cada lado.', 'Monte com queijo derretido e salada.'] },

  { slug: 'arroz-integral-legumes', name: 'Arroz Integral com Legumes', e: '🍚', d: 'Marmita da semana em uma panela', min: 45, serv: 4,
    tags: ['fitness', 'marmita'],
    ing: [['Arroz Integral', 300, 'g'], ['Abobrinha', 1, 'un'], ['Cenoura', 2, 'un'], ['Brócolis', 200, 'g'], ['Azeite', 25, 'ml'], ['Alho', 3, 'un']],
    steps: ['Cozinhe o arroz integral.', 'Salteie os legumes com alho.', 'Misture e divida nos potes.'] },

  { slug: 'frango-cremoso-milho', name: 'Frango Cremoso com Milho', e: '🌽', d: 'Cremoso sem esforço', min: 35, serv: 4,
    tags: ['jantar', 'família'],
    ing: [['Peito de Frango', 600, 'g'], ['Milho', 300, 'g'], ['Creme de Leite', 200, 'ml'], ['Cebola', 1, 'un'], ['Requeijão', 100, 'g'], ['Arroz', 250, 'g']],
    steps: ['Refogue o frango em cubos com cebola.', 'Junte milho e requeijão.', 'Desligue e misture o creme de leite.'] },

  { slug: 'sopa-abobrinha', name: 'Creme de Abobrinha', e: '🥒', d: 'Verde, cremoso, três ingredientes', min: 30, serv: 3,
    tags: ['leve', 'jantar'],
    ing: [['Abobrinha', 3, 'un'], ['Batata', 200, 'g'], ['Cebola', 1, 'un'], ['Azeite', 20, 'ml'], ['Queijo', 50, 'g']],
    steps: ['Cozinhe tudo com pouca água.', 'Bata no liquidificador.', 'Volte ao fogo e ajuste o sal.'] },

  { slug: 'torta-frango', name: 'Torta de Frango de Liquidificador', e: '🥧', d: 'A torta que sua tia faz', min: 60, serv: 6,
    tags: ['jantar', 'família'],
    ing: [['Farinha de Trigo', 250, 'g'], ['Ovo', 3, 'un'], ['Leite', 300, 'ml'], ['Óleo', 100, 'ml'], ['Peito de Frango', 500, 'g'], ['Molho de Tomate', 200, 'g'], ['Requeijão', 100, 'g']],
    steps: ['Bata a massa no liquidificador.', 'Misture frango desfiado com molho e requeijão.', 'Monte em camadas e asse 40 min.'] },

  { slug: 'salada-atum-batata', name: 'Salada de Atum com Batata', e: '🥔', d: 'Fria e substanciosa', min: 30, serv: 3,
    tags: ['leve', 'marmita'],
    ing: [['Atum', 200, 'g'], ['Batata', 500, 'g'], ['Ovo', 3, 'un'], ['Cebola', 1, 'un'], ['Azeite', 30, 'ml'], ['Limão', 1, 'un']],
    steps: ['Cozinhe batatas e ovos.', 'Corte tudo em cubos e misture com o atum.', 'Tempere com azeite, limão e sal.'] },

  { slug: 'macarrao-queijo', name: 'Macarrão com Queijo', e: '🧀', d: 'Cinco minutos de felicidade', min: 20, serv: 2,
    tags: ['rápido', 'conforto'],
    ing: [['Macarrão', 250, 'g'], ['Queijo', 150, 'g'], ['Leite', 200, 'ml'], ['Manteiga', 30, 'g'], ['Farinha de Trigo', 20, 'g']],
    steps: ['Faça um creme com manteiga, farinha e leite.', 'Derreta o queijo no creme.', 'Misture com o macarrão cozido.'] },

  { slug: 'ovo-mexido-tomate', name: 'Ovo Mexido com Tomate', e: '🍅', d: 'O básico com um upgrade', min: 12, serv: 2,
    tags: ['rápido', 'café da manhã'],
    ing: [['Ovo', 4, 'un'], ['Tomate', 2, 'un'], ['Cebola', 1, 'un'], ['Azeite', 15, 'ml']],
    steps: ['Refogue cebola e tomate até desmanchar.', 'Junte os ovos e mexa em fogo baixo.'] },

  { slug: 'feijao-tropeiro', name: 'Feijão Tropeiro', e: '🫘', d: 'Feijão que virou prato principal', min: 40, serv: 4,
    tags: ['almoço', 'família'],
    ing: [['Feijão', 400, 'g'], ['Farinha de Mandioca', 200, 'g'], ['Linguiça', 300, 'g'], ['Bacon', 100, 'g'], ['Ovo', 3, 'un'], ['Couve', 1, 'un']],
    steps: ['Frite bacon e linguiça.', 'Junte o feijão cozido e escorrido.', 'Acrescente farinha, ovos mexidos e couve.'] },

  { slug: 'frango-limao-forno', name: 'Frango ao Limão no Forno', e: '🍋', d: 'Tempere de manhã, asse à noite', min: 55, serv: 4,
    tags: ['jantar', 'leve'],
    ing: [['Peito de Frango', 800, 'g'], ['Limão', 2, 'un'], ['Alho', 5, 'un'], ['Azeite', 30, 'ml'], ['Batata Doce', 500, 'g']],
    steps: ['Marine o frango com limão, alho e azeite.', 'Asse com a batata doce em cubos.', '45 min a 200 °C.'] },

  { slug: 'panqueca-americana', name: 'Panqueca Americana', e: '🥞', d: 'Pilha alta e mel por cima', min: 20, serv: 3,
    tags: ['café da manhã', 'doce'],
    ing: [['Farinha de Trigo', 200, 'g'], ['Leite', 250, 'ml'], ['Ovo', 2, 'un'], ['Açúcar', 40, 'g'], ['Manteiga', 30, 'g']],
    steps: ['Misture os secos e depois os líquidos.', 'Frite em fogo médio até borbulhar.', 'Vire uma vez só.'] },

  { slug: 'salpicao', name: 'Salpicão de Frango', e: '🥗', d: 'Natal o ano inteiro', min: 30, serv: 5,
    tags: ['leve', 'família'],
    ing: [['Peito de Frango', 500, 'g'], ['Cenoura', 2, 'un'], ['Milho', 200, 'g'], ['Requeijão', 150, 'g'], ['Batata Palha', 100, 'g']],
    steps: ['Desfie o frango cozido.', 'Misture com cenoura ralada, milho e requeijão.', 'Batata palha só na hora de servir.'] },

  { slug: 'arroz-doce', name: 'Arroz Doce', e: '🍮', d: 'Canela por cima é obrigatório', min: 45, serv: 5,
    tags: ['doce', 'conforto'],
    ing: [['Arroz', 200, 'g'], ['Leite', 800, 'ml'], ['Açúcar', 150, 'g'], ['Coco', 50, 'g']],
    steps: ['Cozinhe o arroz em água até quase pronto.', 'Junte leite e açúcar e cozinhe mexendo.', 'Finalize com coco e canela.'] },

  { slug: 'lasanha-simples', name: 'Lasanha Simples', e: '🍝', d: 'Camadas resolvem qualquer domingo', min: 70, serv: 6,
    tags: ['fim de semana', 'família'],
    ing: [['Macarrão', 400, 'g'], ['Carne Moída', 600, 'g'], ['Molho de Tomate', 700, 'g'], ['Mussarela', 300, 'g'], ['Presunto', 200, 'g'], ['Creme de Leite', 200, 'ml']],
    steps: ['Faça o molho com a carne.', 'Monte camadas de massa, molho, presunto e queijo.', 'Asse coberto 30 min e mais 15 destampado.'] },

  { slug: 'sopa-cebola', name: 'Sopa de Cebola Gratinada', e: '🧅', d: 'Paciência de 40 minutos vira ouro', min: 50, serv: 3,
    tags: ['jantar', 'conforto'],
    ing: [['Cebola', 5, 'un'], ['Manteiga', 40, 'g'], ['Pão', 3, 'un'], ['Queijo', 150, 'g'], ['Farinha de Trigo', 20, 'g']],
    steps: ['Doure as cebolas fatiadas na manteiga por 30 min.', 'Junte farinha e água e cozinhe.', 'Cubra com pão e queijo e gratine.'] },

  { slug: 'quibe-assado', name: 'Quibe Assado', e: '🥙', d: 'Assadeira única, fatia de tudo', min: 55, serv: 5,
    tags: ['jantar', 'família'],
    ing: [['Carne Moída', 700, 'g'], ['Farinha de Trigo', 150, 'g'], ['Cebola', 1, 'un'], ['Salsinha', 1, 'un'], ['Azeite', 30, 'ml'], ['Limão', 1, 'un']],
    steps: ['Hidrate o trigo e misture com a carne e temperos.', 'Espalhe na assadeira e risque losangos.', 'Regue com azeite e asse 40 min.'] },

  { slug: 'creme-milho', name: 'Creme de Milho', e: '🌽', d: 'Acompanhamento que rouba a cena', min: 25, serv: 4,
    tags: ['acompanhamento', 'conforto'],
    ing: [['Milho', 400, 'g'], ['Leite', 300, 'ml'], ['Manteiga', 30, 'g'], ['Cebola', 1, 'un'], ['Queijo', 60, 'g']],
    steps: ['Bata o milho com o leite e coe.', 'Leve ao fogo com manteiga e cebola até engrossar.', 'Finalize com queijo.'] },

  { slug: 'salada-folhas-ovo', name: 'Salada de Folhas com Ovo', e: '🥬', d: 'Almoço leve de dez minutos', min: 12, serv: 2,
    tags: ['leve', 'rápido'],
    ing: [['Alface', 1, 'un'], ['Ovo', 3, 'un'], ['Tomate', 2, 'un'], ['Azeite', 25, 'ml'], ['Limão', 1, 'un']],
    steps: ['Cozinhe os ovos por 8 minutos.', 'Monte a salada e fatie os ovos por cima.'] },

  { slug: 'frango-empanado-forno', name: 'Frango Empanado de Forno', e: '🍗', d: 'Crocante sem fritura', min: 45, serv: 4,
    tags: ['jantar', 'família'],
    ing: [['Peito de Frango', 700, 'g'], ['Ovo', 2, 'un'], ['Farinha de Mandioca', 150, 'g'], ['Azeite', 30, 'ml'], ['Batata', 500, 'g']],
    steps: ['Corte em tiras e empane no ovo e na farinha.', 'Regue com azeite e asse 30 min a 220 °C.', 'Vire na metade do tempo.'] },

  { slug: 'macarrao-brocolis', name: 'Macarrão com Brócolis', e: '🥦', d: 'Verde no prato sem sofrimento', min: 25, serv: 3,
    tags: ['vegetariano', 'rápido'],
    ing: [['Macarrão', 300, 'g'], ['Brócolis', 300, 'g'], ['Alho', 4, 'un'], ['Azeite', 30, 'ml'], ['Queijo', 80, 'g']],
    steps: ['Cozinhe o brócolis junto com o macarrão nos últimos 3 min.', 'Refogue no alho e azeite.', 'Queijo ralado por cima.'] },

  { slug: 'cachorro-quente-caseiro', name: 'Cachorro-Quente Caseiro', e: '🌭', d: 'Molho de panela muda tudo', min: 30, serv: 4,
    tags: ['lanche', 'família'],
    ing: [['Linguiça', 400, 'g'], ['Pão', 4, 'un'], ['Molho de Tomate', 400, 'g'], ['Cebola', 1, 'un'], ['Batata Palha', 80, 'g']],
    steps: ['Cozinhe as salsichas no molho com cebola por 20 min.', 'Monte no pão com bastante molho.'] },

  { slug: 'omelete-forno', name: 'Omelete de Forno', e: '🍳', d: 'Faz uma vez, come a semana', min: 35, serv: 4,
    tags: ['marmita', 'fitness'],
    ing: [['Ovo', 8, 'un'], ['Queijo', 150, 'g'], ['Tomate', 2, 'un'], ['Cebola', 1, 'un'], ['Brócolis', 150, 'g']],
    steps: ['Bata os ovos com sal.', 'Misture os recheios e despeje na forma.', 'Asse 25 min a 180 °C.'] },

  { slug: 'canja', name: 'Canja de Galinha', e: '🍲', d: 'Remédio da vovó', min: 50, serv: 4,
    tags: ['conforto', 'jantar'],
    ing: [['Coxa de Frango', 600, 'g'], ['Arroz', 150, 'g'], ['Cenoura', 2, 'un'], ['Cebola', 1, 'un'], ['Alho', 3, 'un'], ['Salsinha', 1, 'un']],
    steps: ['Cozinhe o frango e desfie.', 'No caldo, cozinhe arroz e cenoura.', 'Devolva o frango e finalize com salsinha.'] },

  { slug: 'batata-recheada', name: 'Batata Recheada', e: '🥔', d: 'Uma batata grande vira jantar', min: 60, serv: 2,
    tags: ['jantar', 'conforto'],
    ing: [['Batata', 600, 'g'], ['Requeijão', 100, 'g'], ['Bacon', 100, 'g'], ['Queijo', 100, 'g'], ['Cebola', 1, 'un']],
    steps: ['Asse as batatas inteiras por 45 min.', 'Abra ao meio e recheie.', 'Volte ao forno para gratinar.'] },

  { slug: 'smoothie-morango', name: 'Smoothie de Morango', e: '🍓', d: 'Café da manhã cor-de-rosa', min: 5, serv: 1,
    tags: ['rápido', 'café da manhã'],
    ing: [['Morango', 200, 'g'], ['Iogurte', 200, 'ml'], ['Banana', 1, 'un'], ['Aveia', 30, 'g']],
    steps: ['Bata tudo no liquidificador.'] },

  { slug: 'ratatouille-caseiro', name: 'Legumes Assados na Assadeira', e: '🍆', d: 'Corta, tempera, esquece no forno', min: 50, serv: 4,
    tags: ['vegetariano', 'leve'],
    ing: [['Abobrinha', 2, 'un'], ['Tomate', 4, 'un'], ['Cebola', 2, 'un'], ['Pimentão', 2, 'un'], ['Azeite', 40, 'ml'], ['Alho', 4, 'un']],
    steps: ['Fatie tudo em rodelas finas.', 'Arrume na assadeira, regue com azeite e alho.', 'Asse 40 min a 190 °C.'] },

  { slug: 'pao-na-chapa', name: 'Pão na Chapa com Café', e: '☕', d: 'A dupla que abre o dia', min: 8, serv: 1,
    tags: ['rápido', 'café da manhã'],
    ing: [['Pão', 1, 'un'], ['Manteiga', 20, 'g'], ['Café', 10, 'g']],
    steps: ['Abra o pão, passe manteiga e leve à frigideira.', 'Prense até dourar.'] },

  { slug: 'nhoque-batata', name: 'Nhoque de Batata', e: '🥟', d: 'Domingo de tradição', min: 70, serv: 4,
    tags: ['fim de semana', 'família'],
    ing: [['Batata', 1, 'kg'], ['Farinha de Trigo', 300, 'g'], ['Ovo', 1, 'un'], ['Molho de Tomate', 500, 'g'], ['Queijo', 100, 'g']],
    steps: ['Cozinhe e amasse as batatas ainda quentes.', 'Misture farinha e ovo até dar liga.', 'Faça rolinhos, corte e cozinhe até subir.'] },

  { slug: 'frango-yakitori', name: 'Espetinho de Frango', e: '🍢', d: 'Churrasco de frigideira', min: 35, serv: 3,
    tags: ['jantar', 'fim de semana'],
    ing: [['Peito de Frango', 600, 'g'], ['Cebola', 2, 'un'], ['Pimentão', 2, 'un'], ['Azeite', 25, 'ml'], ['Alho', 3, 'un']],
    steps: ['Corte tudo em cubos e monte os espetos.', 'Grelhe virando a cada 3 minutos.', 'Pincele com o tempero no fim.'] },

  { slug: 'sopa-lentilha', name: 'Sopa de Lentilha', e: '🍜', d: 'Barata e enche', min: 45, serv: 4,
    tags: ['vegetariano', 'econômico'],
    ing: [['Lentilha', 350, 'g'], ['Cenoura', 2, 'un'], ['Batata', 300, 'g'], ['Cebola', 1, 'un'], ['Alho', 3, 'un'], ['Azeite', 25, 'ml']],
    steps: ['Refogue cebola e alho.', 'Junte lentilha e legumes e cubra com água.', 'Cozinhe 35 min e amasse um pouco.'] },

  { slug: 'sanduiche-queijo-quente', name: 'Misto Quente', e: '🥪', d: 'O lanche que nunca decepciona', min: 10, serv: 1,
    tags: ['rápido', 'lanche'],
    ing: [['Pão de Forma', 2, 'un'], ['Mussarela', 60, 'g'], ['Presunto', 50, 'g'], ['Manteiga', 15, 'g']],
    steps: ['Monte o sanduíche e passe manteiga por fora.', 'Doure dos dois lados prensando.'] },

  { slug: 'peixe-frigideira-limao', name: 'Peixe na Frigideira com Limão', e: '🐟', d: 'Quinze minutos e está na mesa', min: 18, serv: 2,
    tags: ['rápido', 'leve'],
    ing: [['Tilápia', 400, 'g'], ['Limão', 1, 'un'], ['Manteiga', 25, 'g'], ['Alho', 2, 'un'], ['Arroz', 150, 'g']],
    steps: ['Tempere os filés com sal e limão.', 'Doure na manteiga com alho, 3 min de cada lado.', 'Sirva com arroz.'] },

  { slug: 'cuscuz-paulista', name: 'Cuscuz Paulista', e: '🌽', d: 'Bonito de servir, fácil de fazer', min: 45, serv: 5,
    tags: ['família', 'fim de semana'],
    ing: [['Fubá', 300, 'g'], ['Sardinha', 200, 'g'], ['Molho de Tomate', 300, 'g'], ['Ovo', 3, 'un'], ['Milho', 200, 'g'], ['Cebola', 1, 'un']],
    steps: ['Refogue sardinha, molho e milho.', 'Misture a farinha até dar liga.', 'Prense na forma e desenforme.'] },

  { slug: 'iogurte-granola-frutas', name: 'Iogurte com Granola e Frutas', e: '🥣', d: 'Monta em dois minutos', min: 5, serv: 1,
    tags: ['rápido', 'café da manhã'],
    ing: [['Iogurte', 200, 'ml'], ['Granola', 50, 'g'], ['Banana', 1, 'un'], ['Morango', 100, 'g']],
    steps: ['Camadas de iogurte, fruta e granola no copo.'] },

  { slug: 'arroz-frito-sobras', name: 'Arroz Frito de Sobras', e: '🍚', d: 'A geladeira inteira em uma frigideira', min: 20, serv: 3,
    tags: ['aproveitamento', 'rápido'],
    ing: [['Arroz', 400, 'g'], ['Ovo', 3, 'un'], ['Cenoura', 1, 'un'], ['Cebola', 1, 'un'], ['Presunto', 150, 'g'], ['Óleo', 25, 'ml']],
    steps: ['Frigideira bem quente e óleo.', 'Mexa os ovos, tire e reserve.', 'Salteie tudo junto com o arroz frio.'] },

  { slug: 'mousse-maracuja', name: 'Mousse Rápido', e: '🍨', d: 'Três ingredientes, geladeira e pronto', min: 15, serv: 5,
    tags: ['doce', 'rápido'],
    ing: [['Creme de Leite', 300, 'ml'], ['Açúcar', 100, 'g'], ['Leite', 200, 'ml']],
    steps: ['Bata tudo no liquidificador por 3 minutos.', 'Leve à geladeira por 2 horas.'] },
];
