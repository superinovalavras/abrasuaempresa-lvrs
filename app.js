(function () {
  "use strict";

  /*
    Contato da Sala Mineira do Empreendedor de Lavras.
    Preencha aqui: campo vazio não aparece no site. Enquanto tudo estiver vazio,
    o site mostra só a orientação de procurar a Sala Mineira na Prefeitura.
  */
  var CONTATO = {
    endereco: "",  // ex.: "Rua Exemplo, 100, Centro"
    horario: "",   // ex.: "Segunda a sexta, das 8h às 17h"
    telefone: "",  // ex.: "(35) 3000-0000"
    whatsapp: "",  // só números com DDD, ex.: "35900000000"
    email: ""
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
    scrollTo({ top: Math.max(0, y), behavior: reduzido ? "auto" : comportamento || "smooth" });
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
        $$(".linkar", resp).forEach(function (n) { n.remove(); });
        return {
          "@type": "Question",
          name: $("summary", d).lastChild.textContent.trim(),
          acceptedAnswer: { "@type": "Answer", text: resp.textContent.replace(/\s+/g, " ").trim() }
        };
      })
    };
    document.head.appendChild(el("script", { type: "application/ld+json" }, [JSON.stringify(ld)]));
  } catch (e) {}

  // ---------- prints ampliados ----------
  var lb = $("#lightbox"), lbImg = $("img", lb), lbLeg = $(".lb-leg", lb), lbFechar = $(".lb-fechar", lb), ultimo = null;
  function abrirLb(img, botao) {
    lbImg.src = img.src; lbImg.alt = img.alt; lbLeg.textContent = img.alt;
    lb.hidden = false; ultimo = botao;
    document.body.style.overflow = "hidden";
    lbFechar.focus();
  }
  function fecharLb() {
    lb.hidden = true;
    document.body.style.overflow = "";
    if (ultimo) ultimo.focus();
  }
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-zoom]");
    if (b) abrirLb($("img", b), b);
  });
  lbFechar.addEventListener("click", fecharLb);
  lb.addEventListener("click", function (e) { if (e.target === lb || e.target.classList.contains("lb-img")) fecharLb(); });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { if (!lb.hidden) fecharLb(); else fecharMenu(); }
    if (e.key === "Tab" && !lb.hidden) { e.preventDefault(); lbFechar.focus(); }
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
  (function () {
    var dl = $("#contato-dados");
    var campos = [["endereco", "Endereço"], ["horario", "Horário"], ["telefone", "Telefone"], ["email", "E-mail"]];
    var algum = false;
    campos.forEach(function (c) {
      var v = CONTATO[c[0]];
      if (!v) return;
      algum = true;
      var dd = c[0] === "email" ? el("dd", {}, [el("a", { href: "mailto:" + v, texto: v })])
        : c[0] === "telefone" ? el("dd", {}, [el("a", { href: "tel:+55" + v.replace(/\D/g, ""), texto: v })])
        : el("dd", { texto: v });
      dl.appendChild(el("div", {}, [el("dt", { texto: c[1] }), dd]));
    });
    if (CONTATO.whatsapp) {
      algum = true;
      dl.appendChild(el("div", {}, [el("a", { class: "btn", href: "https://wa.me/55" + CONTATO.whatsapp.replace(/\D/g, ""), target: "_blank", rel: "noopener", texto: "Chamar no WhatsApp" })]));
    }
    if (!algum) dl.appendChild(el("div", {}, [el("dd", { texto: "Procure a Sala Mineira do Empreendedor na Prefeitura de Lavras." })]));
  })();

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
    requestAnimationFrame(function () { irPara(h, "auto"); });
  } else {
    var salva = store.get("aba");
    if (salva && idsAbas.indexOf(salva) > -1) mostrar(salva);
  }
})();
