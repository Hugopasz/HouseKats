// Catálogo pré-aprovado, lote A (comida de casa brasileira, dia a dia).
// ing: [nome, quantidade, unidade]. A categoria e os macros saem da tabela em lib/food.js.

export default [
  { slug: 'arroz-feijao-bife', name: 'Arroz, Feijão e Bife', e: '🍛', d: 'O clássico inegociável', min: 40, serv: 2,
    tags: ['almoço', 'clássico'],
    ing: [['Arroz', 150, 'g'], ['Feijão', 200, 'g'], ['Bife', 300, 'g'], ['Alho', 2, 'un'], ['Óleo', 15, 'ml']],
    steps: ['Refogue o alho no óleo e junte o arroz com o dobro de água.', 'Tempere os bifes com sal e frite em fogo alto.', 'Esquente o feijão e sirva tudo junto.'] },

  { slug: 'frango-grelhado-arroz', name: 'Frango Grelhado com Arroz', e: '🍗', d: 'Proteína no capricho, sem complicação', min: 30, serv: 2,
    tags: ['almoço', 'fitness'],
    ing: [['Peito de Frango', 400, 'g'], ['Arroz', 150, 'g'], ['Alho', 2, 'un'], ['Azeite', 15, 'ml'], ['Limão', 1, 'un']],
    steps: ['Tempere o frango com alho, sal e limão.', 'Grelhe 6 minutos de cada lado.', 'Sirva com o arroz soltinho.'] },

  { slug: 'macarrao-alho-oleo', name: 'Macarrão Alho e Óleo', e: '🍝', d: 'Cinco ingredientes, quinze minutos', min: 15, serv: 2,
    tags: ['rápido', 'jantar'],
    ing: [['Macarrão', 250, 'g'], ['Alho', 4, 'un'], ['Azeite', 40, 'ml'], ['Salsinha', 1, 'un']],
    steps: ['Cozinhe o macarrão al dente.', 'Doure o alho fatiado no azeite sem queimar.', 'Misture tudo com salsinha picada.'] },

  { slug: 'omelete-queijo', name: 'Omelete de Queijo', e: '🍳', d: 'Café da manhã que segura até o almoço', min: 10, serv: 1,
    tags: ['rápido', 'café da manhã'],
    ing: [['Ovo', 3, 'un'], ['Queijo', 40, 'g'], ['Manteiga', 10, 'g']],
    steps: ['Bata os ovos com sal.', 'Derreta a manteiga na frigideira e despeje.', 'Coloque o queijo no meio e dobre.'] },

  { slug: 'strogonoff-frango', name: 'Strogonoff de Frango', e: '🥘', d: 'Domingo em forma de panela', min: 35, serv: 4,
    tags: ['almoço', 'família'],
    ing: [['Peito de Frango', 600, 'g'], ['Creme de Leite', 300, 'ml'], ['Molho de Tomate', 200, 'g'], ['Cebola', 1, 'un'], ['Arroz', 250, 'g']],
    steps: ['Doure o frango em cubos com a cebola.', 'Junte o molho e cozinhe 10 minutos.', 'Desligue o fogo e misture o creme de leite.'] },

  { slug: 'feijoada-simples', name: 'Feijoada Simplificada', e: '🍲', d: 'Versão de casa, sem drama', min: 90, serv: 6,
    tags: ['fim de semana', 'família'],
    ing: [['Feijão', 500, 'g'], ['Linguiça', 400, 'g'], ['Bacon', 150, 'g'], ['Cebola', 1, 'un'], ['Alho', 4, 'un'], ['Arroz', 300, 'g'], ['Couve', 1, 'un']],
    steps: ['Cozinhe o feijão até amaciar.', 'Frite bacon, linguiça, cebola e alho.', 'Junte tudo e apure 30 minutos.', 'Sirva com arroz e couve refogada.'] },

  { slug: 'panqueca-carne', name: 'Panqueca de Carne', e: '🥞', d: 'Rende bem e agrada geral', min: 45, serv: 4,
    tags: ['jantar', 'família'],
    ing: [['Farinha de Trigo', 200, 'g'], ['Leite', 400, 'ml'], ['Ovo', 2, 'un'], ['Carne Moída', 400, 'g'], ['Molho de Tomate', 300, 'g'], ['Cebola', 1, 'un']],
    steps: ['Bata farinha, leite e ovos para a massa.', 'Refogue a carne com cebola.', 'Recheie os discos e cubra com molho.'] },

  { slug: 'sopa-legumes', name: 'Sopa de Legumes', e: '🍜', d: 'Para quando o dia foi longo', min: 40, serv: 4,
    tags: ['jantar', 'leve'],
    ing: [['Batata', 300, 'g'], ['Cenoura', 2, 'un'], ['Abobrinha', 1, 'un'], ['Cebola', 1, 'un'], ['Alho', 2, 'un'], ['Azeite', 15, 'ml']],
    steps: ['Refogue cebola e alho.', 'Junte os legumes em cubos e cubra com água.', 'Cozinhe 25 minutos e amasse um pouco.'] },

  { slug: 'ovos-mexidos-pao', name: 'Ovos Mexidos com Pão', e: '🍳', d: 'O café da manhã que nunca falha', min: 10, serv: 1,
    tags: ['rápido', 'café da manhã'],
    ing: [['Ovo', 3, 'un'], ['Pão', 2, 'un'], ['Manteiga', 15, 'g']],
    steps: ['Mexa os ovos em fogo baixo com manteiga.', 'Torre o pão.', 'Sal só no final.'] },

  { slug: 'file-frango-parmegiana', name: 'Frango à Parmegiana', e: '🍗', d: 'Dia de festa no meio da semana', min: 50, serv: 3,
    tags: ['almoço', 'família'],
    ing: [['Peito de Frango', 600, 'g'], ['Ovo', 2, 'un'], ['Farinha de Trigo', 100, 'g'], ['Molho de Tomate', 400, 'g'], ['Mussarela', 200, 'g'], ['Arroz', 200, 'g'], ['Óleo', 100, 'ml']],
    steps: ['Empane os filés na farinha e no ovo.', 'Frite até dourar.', 'Cubra com molho e queijo e leve ao forno 15 min.'] },

  { slug: 'salada-frango-desfiado', name: 'Salada com Frango Desfiado', e: '🥗', d: 'Leve sem ser triste', min: 25, serv: 2,
    tags: ['leve', 'almoço'],
    ing: [['Peito de Frango', 300, 'g'], ['Alface', 1, 'un'], ['Tomate', 2, 'un'], ['Cenoura', 1, 'un'], ['Azeite', 20, 'ml'], ['Limão', 1, 'un']],
    steps: ['Cozinhe e desfie o frango.', 'Monte a salada e tempere com azeite e limão.'] },

  { slug: 'arroz-carreteiro', name: 'Arroz Carreteiro', e: '🍛', d: 'Resolve o almoço com o que sobrou', min: 35, serv: 4,
    tags: ['almoço', 'aproveitamento'],
    ing: [['Arroz', 300, 'g'], ['Carne', 400, 'g'], ['Cebola', 1, 'un'], ['Alho', 3, 'un'], ['Tomate', 2, 'un'], ['Óleo', 20, 'ml']],
    steps: ['Refogue a carne desfiada com cebola e alho.', 'Junte o arroz cru e refogue.', 'Cubra com água e cozinhe.'] },

  { slug: 'escondidinho-carne', name: 'Escondidinho de Carne', e: '🥧', d: 'Purê por cima resolve tudo', min: 55, serv: 4,
    tags: ['jantar', 'família'],
    ing: [['Carne Moída', 500, 'g'], ['Batata', 800, 'g'], ['Leite', 150, 'ml'], ['Manteiga', 30, 'g'], ['Cebola', 1, 'un'], ['Mussarela', 150, 'g']],
    steps: ['Cozinhe e amasse as batatas com leite e manteiga.', 'Refogue a carne com cebola.', 'Monte em camadas e gratine.'] },

  { slug: 'tapioca-queijo', name: 'Tapioca de Queijo', e: '🥞', d: 'Pronta antes do café ficar pronto', min: 8, serv: 1,
    tags: ['rápido', 'café da manhã'],
    ing: [['Tapioca', 60, 'g'], ['Queijo Minas', 60, 'g']],
    steps: ['Espalhe a goma na frigideira quente.', 'Recheie com queijo e dobre.'] },

  { slug: 'frango-xadrez', name: 'Frango Xadrez', e: '🥘', d: 'Colorido e rápido', min: 30, serv: 3,
    tags: ['jantar', 'colorido'],
    ing: [['Peito de Frango', 500, 'g'], ['Pimentão', 2, 'un'], ['Cebola', 1, 'un'], ['Amendoim', 60, 'g'], ['Arroz', 200, 'g'], ['Óleo', 20, 'ml']],
    steps: ['Doure o frango em cubos.', 'Junte os legumes e refogue rápido.', 'Finalize com amendoim.'] },

  { slug: 'macarrao-bolonhesa', name: 'Macarrão à Bolonhesa', e: '🍝', d: 'Panela grande, todo mundo feliz', min: 40, serv: 4,
    tags: ['jantar', 'família'],
    ing: [['Macarrão', 400, 'g'], ['Carne Moída', 500, 'g'], ['Molho de Tomate', 500, 'g'], ['Cebola', 1, 'un'], ['Alho', 3, 'un'], ['Azeite', 20, 'ml']],
    steps: ['Refogue cebola e alho no azeite.', 'Junte a carne e doure bem.', 'Acrescente o molho e cozinhe 20 minutos.'] },

  { slug: 'peixe-assado-legumes', name: 'Peixe Assado com Legumes', e: '🐟', d: 'Vai pro forno e você descansa', min: 45, serv: 3,
    tags: ['leve', 'jantar'],
    ing: [['Tilápia', 600, 'g'], ['Batata', 400, 'g'], ['Cenoura', 2, 'un'], ['Cebola', 1, 'un'], ['Azeite', 30, 'ml'], ['Limão', 1, 'un']],
    steps: ['Tempere o peixe com limão, sal e alho.', 'Espalhe os legumes fatiados na assadeira.', 'Asse a 200 °C por 35 minutos.'] },

  { slug: 'cuscuz-ovo', name: 'Cuscuz com Ovo', e: '🌽', d: 'Nordeste resolvendo seu café', min: 15, serv: 2,
    tags: ['rápido', 'café da manhã'],
    ing: [['Cuscuz', 150, 'g'], ['Ovo', 2, 'un'], ['Manteiga', 15, 'g']],
    steps: ['Hidrate o cuscuz e leve à cuscuzeira 10 min.', 'Frite os ovos e sirva por cima com manteiga.'] },

  { slug: 'baiao-de-dois', name: 'Baião de Dois', e: '🍲', d: 'Arroz e feijão que viraram um só', min: 45, serv: 4,
    tags: ['almoço', 'família'],
    ing: [['Arroz', 250, 'g'], ['Feijão', 250, 'g'], ['Linguiça', 200, 'g'], ['Queijo Minas', 150, 'g'], ['Cebola', 1, 'un'], ['Alho', 3, 'un']],
    steps: ['Frite a linguiça em rodelas.', 'Refogue com cebola e alho e junte arroz e feijão.', 'Finalize com queijo em cubos.'] },

  { slug: 'sanduiche-natural', name: 'Sanduíche Natural de Frango', e: '🥪', d: 'Marmita de bolso', min: 15, serv: 2,
    tags: ['rápido', 'lanche'],
    ing: [['Pão de Forma', 4, 'un'], ['Peito de Frango', 250, 'g'], ['Requeijão', 60, 'g'], ['Cenoura', 1, 'un'], ['Alface', 1, 'un']],
    steps: ['Desfie o frango cozido e misture com requeijão e cenoura ralada.', 'Monte os sanduíches com alface.'] },

  { slug: 'risoto-frango-simples', name: 'Risoto de Frango Simples', e: '🍚', d: 'Cremoso sem precisar de vinho', min: 40, serv: 3,
    tags: ['jantar', 'cremoso'],
    ing: [['Arroz', 250, 'g'], ['Peito de Frango', 400, 'g'], ['Cebola', 1, 'un'], ['Queijo', 80, 'g'], ['Manteiga', 30, 'g'], ['Leite', 100, 'ml']],
    steps: ['Refogue a cebola na manteiga e junte o arroz.', 'Acrescente água aos poucos, mexendo.', 'Misture o frango desfiado, o leite e o queijo no fim.'] },

  { slug: 'lentilha-arroz', name: 'Lentilha com Arroz', e: '🫘', d: 'Barato, forte e cheio de proteína', min: 45, serv: 4,
    tags: ['vegetariano', 'econômico'],
    ing: [['Lentilha', 300, 'g'], ['Arroz', 250, 'g'], ['Cebola', 1, 'un'], ['Alho', 3, 'un'], ['Azeite', 25, 'ml'], ['Cenoura', 1, 'un']],
    steps: ['Cozinhe a lentilha com a cenoura em cubos.', 'Refogue cebola e alho e junte.', 'Sirva sobre o arroz.'] },

  { slug: 'frango-ao-molho', name: 'Frango ao Molho de Tomate', e: '🍗', d: 'Molho que pede pão para raspar', min: 40, serv: 4,
    tags: ['almoço', 'família'],
    ing: [['Coxa de Frango', 800, 'g'], ['Molho de Tomate', 500, 'g'], ['Cebola', 1, 'un'], ['Alho', 4, 'un'], ['Azeite', 25, 'ml'], ['Arroz', 250, 'g']],
    steps: ['Doure as coxas dos dois lados.', 'Junte cebola, alho e molho.', 'Cozinhe tampado por 25 minutos.'] },

  { slug: 'purê-linguica', name: 'Purê com Linguiça', e: '🌭', d: 'Conforto em duas panelas', min: 35, serv: 3,
    tags: ['jantar', 'conforto'],
    ing: [['Batata', 700, 'g'], ['Leite', 150, 'ml'], ['Manteiga', 40, 'g'], ['Linguiça', 400, 'g'], ['Cebola', 1, 'un']],
    steps: ['Cozinhe e amasse as batatas com leite e manteiga.', 'Frite a linguiça com cebola.', 'Sirva por cima do purê.'] },

  { slug: 'vitamina-banana-aveia', name: 'Vitamina de Banana com Aveia', e: '🥤', d: 'Café da manhã no liquidificador', min: 5, serv: 1,
    tags: ['rápido', 'café da manhã'],
    ing: [['Banana', 2, 'un'], ['Leite', 250, 'ml'], ['Aveia', 40, 'g'], ['Pasta de Amendoim', 20, 'g']],
    steps: ['Bata tudo no liquidificador.', 'Se quiser, gelo por último.'] },

  { slug: 'ovo-frito-arroz-feijao', name: 'Arroz, Feijão e Ovo Frito', e: '🍳', d: 'Quando não tem carne e nem paciência', min: 20, serv: 2,
    tags: ['rápido', 'econômico'],
    ing: [['Arroz', 200, 'g'], ['Feijão', 250, 'g'], ['Ovo', 4, 'un'], ['Óleo', 20, 'ml'], ['Alho', 2, 'un']],
    steps: ['Esquente arroz e feijão.', 'Frite os ovos com a borda crocante.', 'Alho frito por cima resolve.'] },

  { slug: 'quiche-legumes', name: 'Torta Salgada de Legumes', e: '🥧', d: 'Massa de liquidificador, recheio livre', min: 55, serv: 6,
    tags: ['jantar', 'vegetariano'],
    ing: [['Farinha de Trigo', 250, 'g'], ['Ovo', 3, 'un'], ['Leite', 300, 'ml'], ['Óleo', 100, 'ml'], ['Abobrinha', 1, 'un'], ['Cenoura', 2, 'un'], ['Queijo', 120, 'g']],
    steps: ['Bata a massa no liquidificador.', 'Espalhe metade, coloque o recheio, cubra com o resto.', 'Asse 40 min a 180 °C.'] },

  { slug: 'yakisoba-caseiro', name: 'Yakisoba Caseiro', e: '🍜', d: 'Legumes crocantes e macarrão', min: 30, serv: 3,
    tags: ['jantar', 'colorido'],
    ing: [['Macarrão', 300, 'g'], ['Peito de Frango', 400, 'g'], ['Cenoura', 2, 'un'], ['Brócolis', 200, 'g'], ['Pimentão', 1, 'un'], ['Óleo', 25, 'ml']],
    steps: ['Cozinhe o macarrão e reserve.', 'Salteie o frango e depois os legumes em fogo alto.', 'Junte tudo e sirva na hora.'] },

  { slug: 'bife-acebolado', name: 'Bife Acebolado', e: '🥩', d: 'Cebola dourada é metade do prato', min: 25, serv: 2,
    tags: ['almoço', 'clássico'],
    ing: [['Bife', 400, 'g'], ['Cebola', 2, 'un'], ['Óleo', 20, 'ml'], ['Arroz', 200, 'g'], ['Alho', 2, 'un']],
    steps: ['Sele os bifes em fogo alto.', 'Doure a cebola na mesma panela.', 'Devolva os bifes e sirva com arroz.'] },

  { slug: 'salada-grao-de-bico', name: 'Salada de Grão-de-Bico', e: '🥗', d: 'Fria, forte e dura na geladeira', min: 20, serv: 3,
    tags: ['leve', 'vegetariano'],
    ing: [['Grão de Bico', 400, 'g'], ['Tomate', 2, 'un'], ['Cebola', 1, 'un'], ['Azeite', 30, 'ml'], ['Limão', 1, 'un'], ['Salsinha', 1, 'un']],
    steps: ['Escorra o grão-de-bico cozido.', 'Misture com os vegetais picados.', 'Tempere com azeite, limão e sal.'] },

  { slug: 'pizza-caseira', name: 'Pizza Caseira', e: '🍕', d: 'Sexta-feira resolvida', min: 60, serv: 4,
    tags: ['fim de semana', 'família'],
    ing: [['Farinha de Trigo', 500, 'g'], ['Molho de Tomate', 300, 'g'], ['Mussarela', 300, 'g'], ['Azeite', 30, 'ml'], ['Tomate', 2, 'un']],
    steps: ['Faça a massa com farinha, água morna, sal e azeite.', 'Deixe crescer 40 minutos.', 'Abra, cubra e asse no forno mais quente que tiver.'] },

  { slug: 'frango-assado-batata', name: 'Frango Assado com Batata', e: '🍗', d: 'Uma assadeira, zero louça extra', min: 70, serv: 4,
    tags: ['fim de semana', 'família'],
    ing: [['Coxa de Frango', 1, 'kg'], ['Batata', 700, 'g'], ['Alho', 5, 'un'], ['Limão', 1, 'un'], ['Azeite', 40, 'ml']],
    steps: ['Tempere o frango com alho, limão e sal por 30 min.', 'Espalhe com as batatas na assadeira.', 'Asse 50 min a 200 °C virando na metade.'] },

  { slug: 'sopa-feijao', name: 'Sopa de Feijão', e: '🍲', d: 'O feijão de ontem em versão nova', min: 30, serv: 4,
    tags: ['jantar', 'aproveitamento'],
    ing: [['Feijão', 400, 'g'], ['Macarrão', 100, 'g'], ['Cenoura', 1, 'un'], ['Cebola', 1, 'un'], ['Alho', 3, 'un'], ['Bacon', 80, 'g']],
    steps: ['Bata parte do feijão com o caldo.', 'Refogue bacon, cebola e alho.', 'Junte tudo com o macarrão e cozinhe.'] },

  { slug: 'wrap-frango', name: 'Wrap de Frango', e: '🌯', d: 'Enrolou, comeu', min: 20, serv: 2,
    tags: ['rápido', 'lanche'],
    ing: [['Farinha de Trigo', 150, 'g'], ['Peito de Frango', 300, 'g'], ['Alface', 1, 'un'], ['Tomate', 1, 'un'], ['Requeijão', 50, 'g']],
    steps: ['Faça discos finos de massa na frigideira.', 'Recheie com frango desfiado e salada.', 'Enrole apertado.'] },

  { slug: 'arroz-brocolis', name: 'Arroz de Brócolis', e: '🥦', d: 'Acompanhamento que virou prato', min: 30, serv: 3,
    tags: ['vegetariano', 'acompanhamento'],
    ing: [['Arroz', 250, 'g'], ['Brócolis', 300, 'g'], ['Alho', 4, 'un'], ['Azeite', 25, 'ml'], ['Queijo', 60, 'g']],
    steps: ['Cozinhe o arroz normalmente.', 'Refogue o brócolis com bastante alho.', 'Misture e finalize com queijo ralado.'] },

  { slug: 'panqueca-doce-banana', name: 'Panqueca de Banana', e: '🥞', d: 'Três ingredientes, café da manhã de domingo', min: 15, serv: 2,
    tags: ['café da manhã', 'doce'],
    ing: [['Banana', 2, 'un'], ['Ovo', 2, 'un'], ['Aveia', 60, 'g']],
    steps: ['Amasse a banana e misture com ovo e aveia.', 'Frite em porções pequenas.'] },

  { slug: 'carne-panela', name: 'Carne de Panela', e: '🥩', d: 'Cozinha sozinha enquanto você vive', min: 90, serv: 5,
    tags: ['fim de semana', 'família'],
    ing: [['Carne', 1, 'kg'], ['Cebola', 2, 'un'], ['Alho', 4, 'un'], ['Tomate', 3, 'un'], ['Cenoura', 2, 'un'], ['Óleo', 30, 'ml']],
    steps: ['Sele a carne em pedaços grandes.', 'Junte os temperos e cubra com água.', 'Cozinhe em fogo baixo por 1h20.'] },

  { slug: 'macarrao-atum', name: 'Macarrão com Atum', e: '🐟', d: 'Despensa salvando o jantar', min: 20, serv: 2,
    tags: ['rápido', 'econômico'],
    ing: [['Macarrão', 250, 'g'], ['Atum', 200, 'g'], ['Molho de Tomate', 300, 'g'], ['Alho', 3, 'un'], ['Azeite', 20, 'ml']],
    steps: ['Cozinhe o macarrão.', 'Refogue alho, junte molho e atum.', 'Misture e sirva.'] },

  { slug: 'ovo-poche-torrada', name: 'Ovo Poché na Torrada', e: '🍳', d: 'Café da manhã com ares de café bonito', min: 12, serv: 1,
    tags: ['rápido', 'café da manhã'],
    ing: [['Ovo', 2, 'un'], ['Pão', 2, 'un'], ['Abacate', 0.5, 'un'], ['Azeite', 10, 'ml']],
    steps: ['Ferva água com um fio de vinagre e faça os ovos poché.', 'Amasse o abacate na torrada.', 'Coloque o ovo por cima.'] },

  { slug: 'sopa-frango-mandioca', name: 'Sopa de Frango com Mandioca', e: '🍜', d: 'Cura resfriado e mau humor', min: 50, serv: 4,
    tags: ['jantar', 'conforto'],
    ing: [['Coxa de Frango', 600, 'g'], ['Mandioca', 500, 'g'], ['Cebola', 1, 'un'], ['Alho', 3, 'un'], ['Cenoura', 1, 'un']],
    steps: ['Cozinhe o frango e desfie, guardando o caldo.', 'Cozinhe a mandioca no caldo até desmanchar.', 'Devolva o frango e ajuste o sal.'] },
];
