(function () {
  "use strict";

  /*
    Contatos de atendimento. Cada um aparece onde houver data-contato="<chave>" no HTML.
    Campo vazio não aparece no site. Dados passados pela Superintendência em 15/10/2026.
  */
  var CONTATOS = {
    // Sala Mineira do Empreendedor de Lavras
    sala: {
      endereco: "",  // ainda não informado; ex.: "Rua Exemplo, 100, Centro"
      horario: "Segunda a sexta, das 12h às 18h",
      telefone: "",  // ex.: "(35) 3000-0000"
      whatsapp: "(35) 3694-4067",  // com DDD; o link do botão usa só os números
      emails: ["saladoempreendedor@lavras.mg.gov.br", "minasfacilalvara@lavras.mg.gov.br"],
      vazio: "Procure a Sala Mineira do Empreendedor na Prefeitura de Lavras."
    },
    // Cadastro Imobiliário (IPTU). O perfil do WhatsApp cita pmllavras.mg.gov.br, mas esse
    // domínio não existe; o site da Prefeitura é lavras.mg.gov.br.
    iptu: {
      endereco: "Av. Doutor Silvio Menicucci, 1575, Presidente Kennedy (Prefeitura)",
      horario: "Das 12h às 18h",
      whatsapp: "(35) 3694-4047",
      emails: ["iptu@lavras.mg.gov.br"]
    }
  };

  // Para onde o botão de cada situação leva: a pessoa sempre sai com o caminho do sistema certo.
  var DESTINOS = {
    jucemg: ["https://jucemg.mg.gov.br/servicos", "Abrir o Portal da Jucemg"],
    sinal: ["https://jucemg.mg.sinal.quasar.srv.br/", "Entrar no SINAL"]
  };
  var SIT_DESTINO = {
    "exigencia": "jucemg", "pend-usuario": "sinal", "pend-doc": "sinal", "pendente": "sinal",
    "aguardando-lib": "sinal", "aguardando-ant": "sinal", "deferido": "sinal", "finalizado": "sinal"
  };

  // O que cada situação do Portal de Serviços e do SINAL quer dizer, e o que fazer.
  var SITUACOES = [
    { id: "exigencia", nome: "Em exigência", onde: "Portal de Serviços",
      o: "A Prefeitura está esperando você no SINAL para concluir o licenciamento.",
      faca: ["Clique em Visualizar na linha da Prefeitura.", "No campo Observação, siga o link para o SINAL e continue de lá."],
      link: ["l3-passo", "Ver o passo 3 do licenciamento"] },
    { id: "pend-usuario", nome: "Pendente do Usuário", onde: "SINAL",
      o: "É a sua vez. O processo está parado esperando uma ação sua, quase sempre responder um questionário.",
      faca: ["Clique em \"Pendente do Usuário\" na coluna Situação.", "Responda com as mesmas respostas dadas no Portal de Serviços, clique em Salvar e em OK."] },
    { id: "pend-doc", nome: "Pendente de documentação", onde: "SINAL",
      o: "Um órgão da Prefeitura pediu um documento. Você também recebe um e-mail avisando.",
      faca: ["Clique em \"Pendente de documentação\" na linha do órgão e leia o pedido no campo Observações.", "Incluir → Escolher → Enviar → Salvar. Aceite o Termo de Responsabilidade e clique em Finalizar.", "Se o pedido for do Controle de Posturas, pode ser a guia de uma taxa: baixe, pague e anexe o comprovante."],
      link: ["r3-doc", "Ver os prints de como anexar"] },
    { id: "pendente", nome: "Pendente", onde: "SINAL",
      o: "A etapa está em andamento. Se o responsável for um órgão da Prefeitura, ele está analisando.",
      faca: ["Aguarde. Se o órgão precisar de algo, a situação muda para \"Pendente de documentação\" e você recebe um e-mail."] },
    { id: "aguardando-lib", nome: "Aguardando Liberação", onde: "SINAL",
      o: "É uma etapa futura. Ela só abre quando as anteriores terminarem.",
      faca: ["Nada a fazer nela agora. Procure a etapa que está \"Pendente do Usuário\" ou \"Pendente\"."] },
    { id: "aguardando-ant", nome: "Aguardando processo anterior", onde: "SINAL",
      o: "Existe outro processo em andamento no mesmo CNPJ, e este só anda depois dele.",
      faca: ["Consulte todos os processos do CNPJ em Acompanhamento.", "Conclua ou cancele o anterior no sistema onde ele foi feito."] },
    { id: "deferido", nome: "Deferido", onde: "SINAL",
      o: "A etapa foi aprovada.",
      faca: ["Siga para a próxima etapa. Quando for a última, os documentos aparecem no ícone de PDF, na coluna Documentos."] },
    { id: "finalizado", nome: "Finalizado", onde: "SINAL",
      o: "A etapa foi concluída.",
      faca: ["Na etapa dos Bombeiros, \"Finalizado\" em azul pode ser clicado para responder o questionário de novo."],
      link: ["xcb", "Responder os Bombeiros de novo"] },
    { id: "indeferido", nome: "Indeferido", onde: "Portal de Serviços ou no SINAL",
      o: "O pedido foi negado e o processo foi encerrado. O motivo fica nas observações e no histórico do processo.",
      faca: ["Indeferimento não tem volta: é preciso abrir um processo novo.", "Licenciamento indeferido automaticamente? Falta a inscrição imobiliária: faça o evento 995.", "Viabilidade indeferida? Tente endereço ou atividades compatíveis com o zoneamento. Se acha que houve erro, procure a Prefeitura."],
      link: ["x995", "Ver o evento 995"] },
    { id: "bloqueado", nome: "Bloqueado", onde: "SINAL",
      o: "O processo ou o documento foi travado. Acontece quando um pedido novo substitui o anterior (uma nova viabilidade bloqueia a antiga) ou quando a Prefeitura bloqueia o documento depois de uma fiscalização.",
      faca: ["Se você abriu um pedido novo, siga por ele.", "Se não foi isso, procure a Sala Mineira do Empreendedor."],
      link: ["contato", "Falar com a Sala Mineira"] }
  ];

  // Roteiros do assistente: [id do destino, título, descrição].
  var ROTAS = {
    nova: { titulo: "Abrir uma empresa nova", passos: [
      ["preparo", "Antes de começar", "gov.br prata, IPTU e as atividades certas"],
      ["viabilidade", "Viabilidade", "Confirme que o endereço pode receber a atividade"],
      ["abertura", "Abertura", "Registro na Jucemg, CNPJ e Inscrição Municipal"],
      ["licenciamento", "Licenciamento", "Dispensa ou alvará, conforme o risco"],
      ["depois", "Depois do alvará", "O que continua valendo"]] },
    mei: { titulo: "Abrir como MEI", passos: [
      ["mei", "Trilha do MEI", "Portal do Empreendedor, sem viabilidade da Jucemg"],
      ["depois", "Depois do alvará", "Licença sanitária e fiscalização continuam valendo"]] },
    alterar: { titulo: "Mudar a empresa", passos: [
      ["alterar", "Como alterar", "O caminho em três passos"],
      ["viabilidade", "Nova viabilidade", "Eventos de Alteração no Portal de Serviços"],
      ["x995", "Só falta o IPTU?", "O evento 995 é gratuito"],
      ["licenciamento", "Licenciamento de novo", "Responda os questionários no SINAL"]] },
    antiga: { titulo: "Alvará digital de empresa antiga", passos: [
      ["xantiga", "Gerar o alvará digital", "Licenciamento pelo menu Empresas do SINAL"],
      ["x995", "Indeferido na hora?", "Falta a inscrição imobiliária: faça o evento 995"],
      ["risco", "Siga o caminho do seu risco", "Risco I, II ou III"]] },
    fechar: { titulo: "Fechar a empresa", passos: [
      ["fechar", "Como fechar", "Baixa no registro e encerramento na Prefeitura"],
      ["situacoes", "Acompanhe a situação", "O que quer dizer cada status do SINAL"]] }
  };
  var DICAS = {
    contador: "Como contador, você precisa constar como contabilista no CNPJ para ver os processos no SINAL, e o sócio precisa cadastrar você como representante no Portal de Serviços para iniciar o licenciamento.",
    socio: "Se um contador vai fazer por você, cadastre-o como representante no Portal de Serviços (Licenciamento → Cadastro de representantes).",
    meiContador: "Antes de começar, confira com o cliente se a atividade está na lista de ocupações permitidas ao MEI."
  };

  // ---------- utilidades ----------
  var store = {
    get: function (k) { try { return localStorage.getItem("ase-" + k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem("ase-" + k, v); } catch (e) {} },
    del: function (k) { try { localStorage.removeItem("ase-" + k); } catch (e) {} }
  };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var reduzido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  function el(tag, attrs, filhos) {
    var n = document.createElement(tag);
    Object.keys(attrs || {}).forEach(function (k) {
      if (k === "texto") n.textContent = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (filhos || []).forEach(function (f) { if (f) n.appendChild(typeof f === "string" ? document.createTextNode(f) : f); });
    return n;
  }
  function copiar(texto, botao, rotulo) {
    function ok() {
      botao.textContent = "Copiado";
      botao.classList.add("feito");
      setTimeout(function () { botao.textContent = rotulo; botao.classList.remove("feito"); }, 1600);
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(texto).then(ok, function () { prompt("Copie o link:", texto); });
    else prompt("Copie o link:", texto);
  }

  // ---------- topo ----------
  var topo = $(".topo");
  var menu = $("#menu");
  var menuBtn = $(".menu-btn");
  function aoRolar() { topo.classList.toggle("rolou", scrollY > 16); }
  addEventListener("scroll", aoRolar, { passive: true });
  aoRolar();
  function fecharMenu() { menu.classList.remove("aberto"); menuBtn.setAttribute("aria-expanded", "false"); menuBtn.setAttribute("aria-label", "Abrir menu"); }
  menuBtn.addEventListener("click", function () {
    var abrir = !menu.classList.contains("aberto");
    menu.classList.toggle("aberto", abrir);
    menuBtn.setAttribute("aria-expanded", String(abrir));
    menuBtn.setAttribute("aria-label", abrir ? "Fechar menu" : "Abrir menu");
  });

  // ---------- abas das etapas ----------
  var abas = $$(".aba");
  var idsAbas = abas.map(function (a) { return a.dataset.aba; });
  function mostrar(id) {
    abas.forEach(function (a) {
      var on = a.dataset.aba === id;
      a.setAttribute("aria-selected", String(on));
      a.tabIndex = on ? 0 : -1;
      document.getElementById(a.dataset.aba).hidden = !on;
    });
    store.set("aba", id);
  }
  abas.forEach(function (a) {
    a.addEventListener("click", function () { mostrar(a.dataset.aba); });
  });
  $(".trilho [role=tablist]").addEventListener("keydown", function (e) {
    var i = abas.indexOf(document.activeElement);
    if (i < 0) return;
    var n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: abas.length - 1 }[e.key];
    if (n === undefined) return;
    e.preventDefault();
    n = (n + abas.length) % abas.length;
    abas[n].focus();
    mostrar(abas[n].dataset.aba);
  });

  // ---------- navegação interna: abre a aba, o acordeão ou o risco antes de rolar ----------
  function irPara(id, comportamento) {
    var alvo = document.getElementById(id);
    if (!alvo || id === "conteudo") return false;
    var painel = alvo.closest(".painel");
    if (painel && painel.hidden) mostrar(painel.id);
    var saida = alvo.closest(".risco-saida");
    if (saida && saida.hidden) setRisco(saida.id.slice(-1));
    var det = alvo.closest("details");
    if (det) det.open = true;
    if (alvo.closest("#faq")) {
      $$("#faq details.alvo").forEach(function (d) { d.classList.remove("alvo"); });
      if (det) { det.hidden = false; det.classList.add("alvo"); }
    }
    var hTopo = topo.offsetHeight;
    var y;
    if (idsAbas.indexOf(id) > -1) {
      // painel: rola até o trilho grudar no topo, com o começo da etapa logo abaixo
      y = $(".paineis").getBoundingClientRect().top + scrollY - hTopo - $(".trilho").offsetHeight;
    } else {
      var extra = alvo.closest(".paineis") ? $(".trilho").offsetHeight : 0;
      y = alvo.getBoundingClientRect().top + scrollY - hTopo - extra - 16;
    }
    // salto longo vai direto: rolar suave por meia página de distância só confunde
    var longe = Math.abs(y - scrollY) > 5000;
    scrollTo({ top: Math.max(0, y), behavior: reduzido || longe ? "auto" : comportamento || "smooth" });
    return true;
  }
  document.addEventListener("click", function (e) {
    var a = e.target.closest('a[href^="#"]');
    if (!a || a.classList.contains("pular")) return;
    var id = a.getAttribute("href").slice(1);
    if (!id || !document.getElementById(id)) return;
    e.preventDefault();
    fecharMenu();
    if (location.hash !== "#" + id) history.pushState(null, "", "#" + id);
    irPara(id);
  });
  addEventListener("popstate", function () { if (location.hash) irPara(location.hash.slice(1), "auto"); });
  $$("[data-ir]").forEach(function (b) {
    b.addEventListener("click", function () {
      history.pushState(null, "", "#" + b.dataset.ir);
      irPara(b.dataset.ir);
    });
  });

  // ---------- perfil ----------
  var botoesPerfil = $$("[data-perfil]");
  function setPerfil(p) {
    botoesPerfil.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.perfil === p)); });
    $$("[data-para]").forEach(function (n) { n.hidden = n.dataset.para !== p; });
    store.set("perfil", p);
  }
  botoesPerfil.forEach(function (b) { b.addEventListener("click", function () { setPerfil(b.dataset.perfil); }); });
  setPerfil(store.get("perfil") || "socio");

  // ---------- progresso ----------
  var caixas = $$("ol.passos input[type=checkbox]");
  function atualizarProgresso() {
    $$("ol.passos").forEach(function (ol) {
      var cs = $$("input[type=checkbox]", ol), n = 0;
      cs.forEach(function (c) { c.closest("li").classList.toggle("feito", c.checked); if (c.checked) n++; });
      var aba = $('.aba[data-aba="' + ol.dataset.grupo + '"]');
      if (!aba) return;
      $(".barra i", aba).style.width = (n / cs.length) * 100 + "%";
      aba.setAttribute("aria-label", $(".t-full", aba).textContent + ", " + n + " de " + cs.length + " passos concluídos");
    });
  }
  caixas.forEach(function (c) {
    if (store.get("ck-" + c.id) === "1") c.checked = true;
    c.addEventListener("change", function () {
      if (c.checked) store.set("ck-" + c.id, "1"); else store.del("ck-" + c.id);
      atualizarProgresso();
    });
  });
  atualizarProgresso();

  // ---------- risco ----------
  var botoesRisco = $$(".risco-escolha button");
  function setRisco(r) {
    botoesRisco.forEach(function (b) { b.setAttribute("aria-pressed", String(b.dataset.r === r)); });
    ["1", "2", "3"].forEach(function (x) { document.getElementById("saida" + x).hidden = x !== r; });
    store.set("risco", r);
  }
  botoesRisco.forEach(function (b) { b.addEventListener("click", function () { setRisco(b.dataset.r); }); });
  setRisco(store.get("risco") || "3");

  // ---------- assistente "qual é o seu caminho?" ----------
  var escolha = { tipo: store.get("tipo"), quem: store.get("quem") };
  var rota = $("#rota");
  function marcarOpcoes() {
    $$(".opcoes").forEach(function (g) {
      $$("button", g).forEach(function (b) { b.setAttribute("aria-checked", String(escolha[g.dataset.q] === b.dataset.v)); });
    });
  }
  function desenharRota() {
    marcarOpcoes();
    if (!escolha.tipo || !ROTAS[escolha.tipo]) return;
    var r = ROTAS[escolha.tipo];
    document.body.dataset.rota = escolha.tipo;
    var lista = el("ol", { class: "rota-passos" }, r.passos.map(function (p) {
      return el("li", {}, [el("a", { href: "#" + p[0] }, [el("span", {}, [el("b", { texto: p[1] }), el("small", { texto: p[2] })])])]);
    }));
    var dica = null;
    if (escolha.tipo === "mei") dica = escolha.quem === "contador" ? DICAS.meiContador : null;
    else if (escolha.tipo !== "fechar" && escolha.quem) dica = DICAS[escolha.quem];
    var filhos = [el("p", { class: "eyebrow", texto: "Seu roteiro" }), el("h3", { texto: r.titulo }), lista];
    if (dica) filhos.push(el("p", { class: "rota-dica", texto: dica }));
    if (!escolha.quem) filhos.push(el("p", { class: "dica", texto: "Responda também quem vai fazer os pedidos para ver as dicas do seu perfil." }));
    rota.replaceChildren.apply(rota, filhos);
  }
  $$(".opcoes button").forEach(function (b) {
    b.addEventListener("click", function () {
      var q = b.closest(".opcoes").dataset.q;
      escolha[q] = b.dataset.v;
      store.set(q, b.dataset.v);
      if (q === "quem") setPerfil(b.dataset.v);
      desenharRota();
    });
  });
  // setas dentro de cada grupo de opções (padrão de radiogroup)
  $$(".opcoes").forEach(function (g) {
    g.addEventListener("keydown", function (e) {
      var bs = $$("button", g), i = bs.indexOf(document.activeElement);
      var n = { ArrowRight: i + 1, ArrowDown: i + 1, ArrowLeft: i - 1, ArrowUp: i - 1 }[e.key];
      if (i < 0 || n === undefined) return;
      e.preventDefault();
      bs[(n + bs.length) % bs.length].focus();
    });
  });
  desenharRota();

  // ---------- tradutor de situações ----------
  var sitBotoes = $("#sit-botoes"), sitSaida = $("#sit-saida");
  SITUACOES.forEach(function (s) {
    var b = el("button", { type: "button", "aria-pressed": "false", "data-sit": s.id }, [s.nome]);
    b.addEventListener("click", function () { mostrarSituacao(s, b); });
    sitBotoes.appendChild(b);
  });
  function mostrarSituacao(s, botao) {
    $$("button", sitBotoes).forEach(function (b) { b.setAttribute("aria-pressed", String(b === botao)); });
    var filhos = [
      el("p", { class: "onde-sit", texto: "Aparece no " + s.onde }),
      el("h3", { texto: s.nome }),
      el("p", { texto: s.o }),
      el("p", { class: "faca", texto: "O que fazer" }),
      el("ol", {}, s.faca.map(function (f) { return el("li", { texto: f }); }))
    ];
    var d = DESTINOS[SIT_DESTINO[s.id]];
    if (d) filhos.push(el("div", { class: "ir" }, [el("a", { class: "btn", href: d[0], target: "_blank", rel: "noopener", texto: d[1] + " ↗" })]));
    if (s.link) filhos.push(el("p", {}, [el("a", { href: "#" + s.link[0], texto: s.link[1] + " →" })]));
    sitSaida.replaceChildren.apply(sitSaida, filhos);
    sitSaida.hidden = false;
  }

  // ---------- problemas: busca e link direto ----------
  var busca = $("#busca"), itens = $$("#faq details"), vazio = $("#vazio");
  function norm(s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); }
  busca.addEventListener("input", function () {
    var t = norm(busca.value.trim()), c = 0;
    itens.forEach(function (d) {
      var m = !t || norm(d.textContent).indexOf(t) > -1;
      d.hidden = !m;
      if (m) c++;
      if (t && m && c === 1) d.open = true;
    });
    vazio.hidden = c > 0;
  });
  itens.forEach(function (d) {
    var b = el("button", { type: "button", class: "link-btn linkar" }, ["Copiar link desta resposta"]);
    b.addEventListener("click", function () {
      copiar(location.origin + location.pathname + "#" + d.id, b, "Copiar link desta resposta");
    });
    $(":scope > div", d).appendChild(b);
  });

  // Dados estruturados de perguntas frequentes, montados a partir do próprio conteúdo.
  try {
    var ld = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: itens.map(function (d) {
        var resp = $(":scope > div", d).cloneNode(true);
        $$(".linkar, .ir", resp).forEach(function (n) { n.remove(); });
        return {
          "@type": "Question",
          name: $("summary", d).lastChild.textContent.trim(),
          acceptedAnswer: { "@type": "Answer", text: resp.textContent.replace(/\s+/g, " ").trim() }
        };
      })
    };
    document.head.appendChild(el("script", { type: "application/ld+json" }, [JSON.stringify(ld)]));
  } catch (e) {}

  // ---------- visualizador de prints ----------
  // Abre a imagem inteira; tocar/clicar num ponto amplia ali até o tamanho real (ou mais,
  // em telas grandes). Ampliado, arrasta-se com o mouse ou o dedo. As setas passam pelos
  // prints do mesmo passo.
  var lb = $("#lightbox"), lbArea = $(".lb-img", lb), lbImg = $("img", lb), lbLeg = $(".lb-leg", lb),
    lbCont = $(".lb-cont", lb), lbZoom = $(".lb-zoom", lb), lbFechar = $(".lb-fechar", lb),
    lbAnt = $(".lb-ant", lb), lbProx = $(".lb-prox", lb);
  var galeria = [], atual = 0, ampliado = false, ultimo = null, arrasto = null;
  var toque = matchMedia("(hover: none)").matches;

  function larguraAmpliada() {
    var nw = lbImg.naturalWidth || 1200, cw = lbArea.clientWidth;
    // tamanho real; em tela grande, um pouco mais; nunca mais que o dobro do original
    return Math.min(Math.max(nw, cw * 1.25), nw * 2);
  }
  function setAmpliado(on, fx, fy) {
    ampliado = on;
    lb.classList.toggle("zoom", on);
    lbZoom.textContent = on ? "Ver inteiro" : "Ampliar";
    lbZoom.setAttribute("aria-pressed", String(on));
    var dica = $(".lb-dica", lb);
    if (dica) dica.textContent = on
      ? (toque ? "Arraste para mover. Toque para ver inteiro." : "Arraste para mover. Clique para ver inteiro.")
      : (toque ? "Toque no ponto que quer ver de perto." : "Clique no ponto que quer ver de perto.");
    if (!on) { lbImg.style.width = ""; return; }
    var w = larguraAmpliada();
    lbImg.style.width = w + "px";
    var h = w * (lbImg.naturalHeight / lbImg.naturalWidth || 0.5);
    lbArea.scrollLeft = (fx === undefined ? 0 : fx * w) - (fx === undefined ? 0 : lbArea.clientWidth / 2);
    lbArea.scrollTop = (fy === undefined ? 0 : fy * h) - (fy === undefined ? 0 : lbArea.clientHeight / 2);
  }
  function mostrarPrint() {
    var img = galeria[atual];
    setAmpliado(false);
    lbImg.src = img.src; lbImg.alt = img.alt;
    lbLeg.replaceChildren(document.createTextNode(img.alt), el("span", { class: "lb-dica" }));
    setAmpliado(false);
    var varios = galeria.length > 1;
    lbCont.textContent = varios ? "Print " + (atual + 1) + " de " + galeria.length : "";
    lbAnt.hidden = lbProx.hidden = !varios;
    lbAnt.disabled = atual === 0;
    lbProx.disabled = atual === galeria.length - 1;
  }
  function abrirLb(botao) {
    var grupo = botao.closest(".prints");
    galeria = $$("[data-zoom] img", grupo);
    atual = Math.max(0, galeria.indexOf($("img", botao)));
    ultimo = botao;
    mostrarPrint();
    lb.hidden = false;
    document.body.style.overflow = "hidden";
    lbFechar.focus();
  }
  function fecharLb() {
    lb.hidden = true;
    setAmpliado(false);
    document.body.style.overflow = "";
    if (ultimo) ultimo.focus();
  }
  function passar(d) {
    var n = atual + d;
    if (n < 0 || n >= galeria.length) return;
    atual = n;
    mostrarPrint();
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-zoom]");
    if (b) abrirLb(b);
  });
  lbFechar.addEventListener("click", fecharLb);
  lbAnt.addEventListener("click", function () { passar(-1); });
  lbProx.addEventListener("click", function () { passar(1); });
  lbZoom.addEventListener("click", function () { setAmpliado(!ampliado, 0.5, 0.5); });
  lbImg.addEventListener("click", function (e) {
    if (arrasto && arrasto.moveu) return;
    if (ampliado) return setAmpliado(false);
    var r = lbImg.getBoundingClientRect();
    setAmpliado(true, (e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
  });
  // fundo vazio fecha (só com a imagem inteira; ampliada, o fundo é área de arrastar)
  lb.addEventListener("click", function (e) { if (!ampliado && (e.target === lb || e.target === lbArea)) fecharLb(); });
  // arrastar com o mouse quando ampliado (no toque, a própria rolagem já move)
  lbArea.addEventListener("pointerdown", function (e) {
    if (!ampliado || e.pointerType !== "mouse") return;
    arrasto = { x: e.clientX, y: e.clientY, l: lbArea.scrollLeft, t: lbArea.scrollTop, moveu: false };
    lbArea.classList.add("arrastando");
    e.preventDefault();
  });
  addEventListener("pointermove", function (e) {
    if (!arrasto) return;
    var dx = e.clientX - arrasto.x, dy = e.clientY - arrasto.y;
    if (Math.abs(dx) + Math.abs(dy) > 4) arrasto.moveu = true;
    lbArea.scrollLeft = arrasto.l - dx;
    lbArea.scrollTop = arrasto.t - dy;
  });
  addEventListener("pointerup", function () {
    if (!arrasto) return;
    lbArea.classList.remove("arrastando");
    var a = arrasto;
    setTimeout(function () { if (arrasto === a) arrasto = null; }, 0);
  });
  document.addEventListener("keydown", function (e) {
    if (lb.hidden) { if (e.key === "Escape") fecharMenu(); return; }
    if (e.key === "Escape") fecharLb();
    else if (e.key === "ArrowLeft" && !ampliado) passar(-1);
    else if (e.key === "ArrowRight" && !ampliado) passar(1);
    else if (e.key === "+" || e.key === "=") setAmpliado(true, 0.5, 0.5);
    else if (e.key === "-") setAmpliado(false);
    else if (e.key === "Tab") {
      // mantém o foco dentro do visualizador
      var focaveis = $$("button:not([hidden]):not([disabled])", lb);
      var i = focaveis.indexOf(document.activeElement);
      e.preventDefault();
      focaveis[(i + (e.shiftKey ? -1 : 1) + focaveis.length) % focaveis.length].focus();
    }
  });

  // ---------- copiar links dos sistemas ----------
  $$("[data-copiar]").forEach(function (b) {
    b.addEventListener("click", function () { copiar(b.dataset.copiar, b, "Copiar"); });
  });

  // ---------- imprimir e recomeçar ----------
  $$("[data-acao]").forEach(function (b) {
    b.addEventListener("click", function () {
      if (b.dataset.acao === "imprimir") return window.print();
      if (!confirm("Apagar todas as marcações de passos concluídos neste navegador?")) return;
      caixas.forEach(function (c) { c.checked = false; store.del("ck-" + c.id); });
      atualizarProgresso();
      mostrar("preparo");
      irPara("preparo");
    });
  });

  // ---------- contato ----------
  // A versão "mini" (dentro de um passo) não leva o botão grande de WhatsApp.
  $$("[data-contato]").forEach(function (dl) {
    var c = CONTATOS[dl.dataset.contato];
    if (!c) return;
    var mini = dl.classList.contains("contato-mini");
    var algum = false;
    var wa = c.whatsapp ? "https://wa.me/55" + c.whatsapp.replace(/\D/g, "") : "";
    function campo(rotulo, filhos) {
      algum = true;
      dl.appendChild(el("div", {}, [el("dt", { texto: rotulo })].concat(filhos)));
    }
    if (wa) campo("WhatsApp", [el("dd", {}, [el("a", { href: wa, target: "_blank", rel: "noopener", texto: c.whatsapp })])]);
    if (c.telefone) campo("Telefone", [el("dd", {}, [el("a", { href: "tel:+55" + c.telefone.replace(/\D/g, ""), texto: c.telefone })])]);
    var emails = (c.emails || []).filter(Boolean);
    if (emails.length) campo(emails.length > 1 ? "E-mails" : "E-mail", emails.map(function (m) {
      return el("dd", {}, [el("a", { href: "mailto:" + m, texto: m })]);
    }));
    if (c.horario) campo("Horário", [el("dd", { texto: c.horario })]);
    if (c.endereco) campo("Endereço", [el("dd", { texto: c.endereco })]);
    if (wa && !mini) dl.appendChild(el("div", {}, [el("a", { class: "btn", href: wa, target: "_blank", rel: "noopener", texto: "Chamar no WhatsApp" })]));
    if (!algum && c.vazio) dl.appendChild(el("div", {}, [el("dd", { texto: c.vazio })]));
  });

  // ---------- menu: marca a seção visível ----------
  if ("IntersectionObserver" in window) {
    var links = $$("#menu a");
    var porId = {};
    links.forEach(function (a) { porId[a.getAttribute("href").slice(1)] = a; });
    var obs = new IntersectionObserver(function (ents) {
      ents.forEach(function (en) {
        if (!en.isIntersecting) return;
        links.forEach(function (a) { a.removeAttribute("aria-current"); });
        var a = porId[en.target.id];
        if (a) a.setAttribute("aria-current", "true");
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    Object.keys(porId).forEach(function (id) { var s = document.getElementById(id); if (s) obs.observe(s); });
  }

  // ---------- estado inicial ----------
  var h = location.hash.slice(1);
  if (h && document.getElementById(h)) {
    setTimeout(function () { irPara(h, "auto"); }, 0);
  } else {
    var salva = store.get("aba");
    if (salva && idsAbas.indexOf(salva) > -1) mostrar(salva);
  }
})();
