# 🦣 MAMUTE KARAOKÊ — Base de Conhecimento Completa

> Documento RAG para agentes de IA. Contém todas as informações do sistema, funcionalidades, lógica de negócio, planos, fluxos de usuário e arquitetura técnica.

**URL do site:** https://ismakaraoke.lovable.app  
**Última atualização:** Fevereiro 2026

---

## ÍNDICE

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Como Funciona](#2-como-funciona)
3. [Público-Alvo](#3-público-alvo)
4. [Planos e Preços](#4-planos-e-preços)
5. [Funcionalidades — Modo Participante](#5-funcionalidades--modo-participante)
6. [Funcionalidades — Modo Coordenador (Host)](#6-funcionalidades--modo-coordenador-host)
7. [Funcionalidades — Modo TV / Telão](#7-funcionalidades--modo-tv--telão)
8. [Funcionalidades — Painel Administrativo](#8-funcionalidades--painel-administrativo)
9. [Algoritmo da Fila Justa PRO](#9-algoritmo-da-fila-justa-pro)
10. [Sistema de Votação e Ranking](#10-sistema-de-votação-e-ranking)
11. [Sistema de Sessões e Reset de Evento](#11-sistema-de-sessões-e-reset-de-evento)
12. [Multi-Idioma](#12-multi-idioma)
13. [Vídeos Explicativos e Manual](#13-vídeos-explicativos-e-manual)
14. [Arquitetura Técnica](#14-arquitetura-técnica)
15. [Links Úteis](#15-links-úteis)
16. [Benefícios do Sistema](#16-benefícios-do-sistema)
17. [Depoimentos](#17-depoimentos)
18. [Perguntas Frequentes (FAQ)](#18-perguntas-frequentes-faq)

---

## 1. Visão Geral do Sistema

O **Mamute Karaokê** é uma plataforma web completa para organização de eventos de karaokê. O sistema digitaliza toda a experiência: inscrição de cantores, fila organizada, votação interativa pelo celular e ranking em tempo real.

### Conceito Principal
- **Sem instalação**: Funciona direto no navegador via QR Code
- **Fila digital inteligente**: Algoritmo de "Fila Justa PRO" com prioridade adaptativa
- **Votação interativa**: Participantes votam pelo celular com notas de 0 a 10
- **Ranking em tempo real**: Atualizado automaticamente após cada votação
- **Multi-instância**: Cada coordenador tem sua própria instância isolada com código único

### Principais Papéis no Sistema
| Papel | Descrição |
|-------|-----------|
| **Participante** | Pessoa que se inscreve para cantar e/ou vota nas apresentações |
| **Coordenador (Host)** | Organizador do evento. Controla a fila, vídeo, votação e ranking |
| **Administrador** | Gerencia coordenadores, instâncias, planos, conteúdo do site e configurações globais |

---

## 2. Como Funciona

O fluxo principal do Mamute Karaokê segue 6 etapas:

### Passo 1: Acesso via QR Code
Os participantes escaneiam o QR Code com o celular e acessam o sistema instantaneamente. Funciona em qualquer ambiente: eventos, estabelecimentos e até festas em casa.

### Passo 2: Busca de Músicas
O participante pode pesquisar e selecionar entre uma grande variedade de vídeos musicais públicos disponíveis online (YouTube). Milhares de opções em diversos estilos musicais — nacionais e internacionais.

### Passo 3: Fila Organizada
Todas as inscrições ficam organizadas em uma fila digital inteligente. Sem papelzinho, sem confusão. O coordenador controla tudo pelo painel. O algoritmo de Fila Justa PRO garante equidade entre os cantores.

### Passo 4: Telão / Painel
Nome, música e ordem são exibidos no painel para manter tudo organizado. Conecte a um telão ou TV para que todos acompanhem. O Modo TV exibe o vídeo, informações do cantor e a fila de espera.

### Passo 5: Votação Interativa
Após cada apresentação, todos votam pelo celular com notas de 0 a 10. Sistema justo e democrático. Cada dispositivo pode votar uma vez por apresentação.

### Passo 6: Ranking em Tempo Real
O ranking é atualizado automaticamente após cada votação. Todos podem acompanhar quem está liderando! Ranking mensal global também disponível.

---

## 3. Público-Alvo

O Mamute Karaokê é ideal para:

- 🎉 **Festas e aniversários** — Diversão garantida para todas as idades
- 🏢 **Eventos corporativos** — Confraternizações e team buildings
- 🎓 **Escolas e universidades** — Gincanas e festivais
- 🏪 **Bares e restaurantes** — Noites temáticas para atrair público
- 🎤 **Karaokê profissional** — DJs e produtores de eventos
- 🌙 **Casas noturnas** — Entretenimento interativo
- ⛪ **Comunidades e igrejas** — Eventos sociais
- 👥 **Congressos e convenções** — Momentos de descontração
- ❤️ **Celebrações em geral** — Casamentos, chás de bebê, etc.

---

## 4. Planos e Preços

Todos os planos incluem **todas as funcionalidades** — a única diferença é o tempo de acesso. Sem taxas ocultas, sem limitações de uso.

### Funcionalidades incluídas em TODOS os planos:
- ✅ Busca de vídeos musicais públicos
- ✅ Fila organizada (algoritmo de Fila Justa PRO)
- ✅ Votação pelo celular
- ✅ Ranking em tempo real
- ✅ Telão para projeção (Modo TV)
- ✅ QR Code de acesso
- ✅ Sem instalar nada

### Tipos de Plano

Os planos são gerenciados dinamicamente pelo administrador via banco de dados. Os planos típicos incluem:

| Plano | Tipo | Ideal para |
|-------|------|------------|
| **Teste Grátis** | Gratuito (1 hora) | Testar rapidamente o sistema |
| **Silver** | Pagamento único | Eventos únicos e festas pontuais |
| **Gold** | Pagamento único | Festas prolongadas e eventos temáticos |
| **Platinum** | Pagamento único | Eventos maiores |
| **Pro** | Assinatura recorrente (mensal/anual) | Uso recorrente em estabelecimentos e profissionais |

### Sistema de Cupons
- Cupons de desconto podem ser criados pelo administrador
- Tipos: percentual ou valor fixo
- Cupons marcados como "visíveis no site" aparecem na página de planos como banner promocional
- Data de validade configurável

### Fluxo de Compra
1. Usuário acessa `/planos` e seleciona um plano
2. Para planos gratuitos: redirecionado para cadastro trial em `/app/cadastro`
3. Para planos pagos: redirecionado para checkout em `/checkout/:planId`
4. Pagamento processado via Stripe
5. Após sucesso: instância criada automaticamente, credenciais enviadas por email

---

## 5. Funcionalidades — Modo Participante

### 5.1 Registro / Cadastro
- Ao acessar via QR Code, o participante preenche: **nome, telefone e email**
- Registro obrigatório por dispositivo, uma vez por instância
- Dados armazenados localmente e no banco para identificação

### 5.2 Inscrição para Cantar ("Quero Cantar")
**Rota:** `/app/inscricao/:instanceCode`

- Participante informa seu nome (pré-preenchido após registro)
- Busca vídeos musicais via integração com YouTube
- Seleciona o vídeo desejado da lista de resultados
- Opção de colar URL manualmente se a busca falhar
- Opção de inscrever **outra pessoa** (checkbox "Inscrever para outra pessoa")
- **Termo de consentimento**: na primeira inscrição, participante aceita os termos
- **Preferência de votação**: participante pode optar por não receber votos em sua apresentação
- **Rate limiting**: 1 inscrição por minuto (proteção contra spam)
- Após inscrição: redirecionado para página de votação

### 5.3 Votação
**Rota:** `/app/vote/:instanceCode`

- Exibe o cantor e música da apresentação ativa
- Slider de votação com notas de 0 a 10
- Um voto por dispositivo por apresentação
- Detecção de troca de vídeo pelo coordenador (reset automático do voto)
- Estados especiais:
  - **Vídeo explicativo em execução**: aviso para aguardar
  - **Apresentação sem votação**: cantor optou por não receber votos
  - **Já votou**: confirmação com ícone de check
  - **Votação encerrada**: exibe nota final
  - **Aguardando**: nenhuma apresentação ativa no momento

### 5.4 Ranking
**Rota:** `/app/ranking/:instanceCode`

- Ranking de todas as apresentações do evento
- Ordenado por nota média (maior para menor)
- Exibe: posição, nome do cantor, música e nota média
- Atualização em tempo real via Supabase Realtime

### 5.5 Fila de Espera (visão do participante)
- Participantes veem a fila de espera na página de votação e inscrição
- Destaque visual para o participante logado
- Indicadores visuais: posição na fila, cantor atual

---

## 6. Funcionalidades — Modo Coordenador (Host)

**Rota:** `/app/host` (ou `/app/host/:instanceCode` para acesso admin)

O coordenador é o organizador do evento. Após fazer login com email e senha, ele tem acesso ao painel completo de controle.

### 6.1 Painel Principal
- **Busca de músicas**: busca no YouTube + autocomplete de nomes de cantores (baseado no histórico da instância)
- **Incluir participante manualmente**: coordenador pode adicionar cantores à fila
- **Toggle de posição**: "Primeiro na fila" (override) ou "Ordem justa" (algoritmo PRO)
- **Campo manual de URL**: quando a busca YouTube falha

### 6.2 Controle de Votação
- **Iniciar Votação**: cria uma nova performance/rodada ativa
- **Encerrar Votação**: fecha a rodada e calcula nota final
- **Próxima**: encerra a rodada atual e carrega automaticamente o próximo cantor da fila
- **Exibição de score em tempo real**: nota média e total de votos

### 6.3 Gerenciamento da Fila
- **Fila Justa PRO**: algoritmo adaptativo de prioridade (detalhes na seção 9)
- **Override manual**: mover cantores para cima/baixo na fila
- **Inserir como próximo**: adicionar cantor no topo da fila (prioridade negativa)
- **Remover da fila**: excluir entrada
- **Editar nome**: alterar nome do cantor (atualiza todas as entradas do mesmo nome)
- **Indicadores visuais**:
  - 🆕 **NOVO**: cantor que ainda não cantou no evento
  - 🎤 **Cantou Nx**: quantidade de músicas cantadas na sessão atual
  - ⏱️ **Espera Xmin**: tempo de espera na fila (exibido após 1 minuto)
  - ⚡ **PRIORIDADE**: entrada inserida manualmente pelo coordenador (override)

### 6.4 Troca de Vídeo
- Coordenador pode trocar o vídeo/música durante uma apresentação ativa
- Reseta votos automaticamente
- Notifica participantes da mudança
- Atualiza metadados da performance

### 6.5 Controle de Inscrições
- **Abrir/fechar inscrições**: toggle para habilitar/desabilitar novas inscrições
- Quando fechadas, participantes veem mensagem informativa

### 6.6 QR Code
- QR Code gerado automaticamente com o código da instância
- Exibível em tela cheia para projeção
- Versão para impressão (QRCodePrintable)

### 6.7 Modo TV / Telão
- Botão para ativar o Modo TV (detalhes na seção 7)

### 6.8 Reset de Evento
- Reseta todas as performances, votos e fila de espera
- Atualiza `session_started_at` para isolar o histórico
- O contador de "Cantou Nx" é zerado
- Dados de performances anteriores são preservados no banco (mas filtrados pela sessão)
- Opção de arquivar o ranking antes do reset

### 6.9 Exportação de Dados
- Exportação de dados dos participantes (nome, email, telefone, instância)
- Formato CSV/Excel
- Disponível no menu do coordenador

### 6.10 Menu e Configurações
- **Ver ranking**: visualizar ranking da noite
- **Resetar evento**: limpar todos os dados do evento atual
- **Alterar senha**: alterar senha do coordenador
- **Sair**: logout do sistema

### 6.11 Segurança
- Login com email e senha
- Senha temporária na primeira vez (obrigatório alterar)
- Última data de acesso registrada
- Instância expirada: acesso bloqueado com mensagem de renovação

---

## 7. Funcionalidades — Modo TV / Telão

O Modo TV é uma visualização otimizada para projeção em telão ou TV. Controlado pelo coordenador.

### Características:
- **Player de vídeo YouTube**: vídeo em tela cheia ou parcial
- **Informações da apresentação**: nome do cantor, música, nota média em tempo real
- **Fila de espera**: dropdown expansível mostrando os próximos cantores
- **Indicadores visuais**: NOVO, Cantou Nx, Espera Xmin (mesmos do painel do coordenador)
- **Botão Próximo**: coordenador avança para o próximo cantor direto do Modo TV
- **Botão Voltar**: retornar ao cantor anterior
- **Confetti**: efeito visual para notas altas (≥9.0 ou novo recorde)
- **QR Code**: exibível para participantes escanearem
- **Inserção de vídeos instrucionais**: entre performances, pode exibir vídeos explicativos

### Fluxo Automático (Próximo no Modo TV):
1. Encerra rodada atual → registra nota final
2. Marca entrada da fila como "done" → incrementa times_sung
3. Rebalanceia a fila com algoritmo PRO
4. Carrega próximo cantor automaticamente → inicia nova rodada
5. (Opcionalmente) insere vídeo instrucional entre performances

---

## 8. Funcionalidades — Painel Administrativo

**Rota:** `/app/admin`

O administrador tem acesso completo ao sistema.

### Seções do Painel Admin:
- **Coordenadores**: gerenciar coordenadores aprovados (visualizar, editar, remover)
- **Solicitações**: aprovar/rejeitar solicitações de novos coordenadores
- **Instâncias**: gerenciar instâncias de karaokê ativas
- **Planos**: configurar planos de assinatura (nome, preço, duração, tipo)
- **Cupons**: criar e gerenciar cupons de desconto
- **Chaves API**: gerenciar chaves de API (YouTube, etc.)
- **Segredos**: configurar variáveis de ambiente seguras
- **Vídeos do Site**: configurar links de vídeos para seções do site
- **Imagens do Site**: gerenciar imagens e banners do site
- **Contatos**: configurar links de contato (WhatsApp, Instagram, email, suporte)
- **Ranking do Site**: visualizar ranking mensal global
- **Arquivos de Eventos**: visualizar rankings arquivados
- **Vídeos Instrucionais**: gerenciar vídeos de instrução para inserção entre performances
- **Mensagens**: enviar mensagens em massa para coordenadores

---

## 9. Algoritmo da Fila Justa PRO

O algoritmo de Fila Justa PRO é o coração do sistema de gerenciamento da fila. Ele garante equidade entre os cantores sem travar a fila quando há poucos participantes.

### 9.1 Fórmula de Pontuação

```
scoreFinal = bonusFewSongs + bonusNewSinger + timeScore - repetitionPenalty
```

| Componente | Fórmula | Descrição |
|-----------|---------|-----------|
| **bonusFewSongs** | `max(0, (3 - songsSung) * 60)` | Quem cantou menos tem mais prioridade. Máximo: 180 pts (0 músicas) |
| **bonusNewSinger** | `songsSung === 0 ? 80 : 0` | Bônus extra para cantor que nunca cantou no evento |
| **timeScore** | `minutesSinceLastSung * 2` | 2 pontos por minuto desde a última vez que cantou. Nunca cantou = 999 min |

### 9.2 Anti-Repetição Adaptativa

O sistema de cooldown é adaptativo com base no número de cantores ativos (**N** = cantores distintos com pelo menos 1 música na fila):

| Condição | N (cantores ativos) | Penalidade | Comportamento |
|----------|---------------------|------------|---------------|
| **Bloqueio duro** | N ≥ 3 (2+ outros esperando) | -99.999 | Último cantor NÃO pode cantar imediatamente |
| **Penalidade leve** | N = 2 (1 outro esperando) | -9.999 | Outro canta antes, mas não impede se for o único |
| **Sem restrição** | N ≤ 1 (só ele ou fila vazia) | 0 | Libera normalmente, sem penalidade |

### 9.3 Regras de Desempate

Quando dois cantores têm a mesma pontuação:
1. **lastSungAt mais antigo** → quem espera há mais tempo sem cantar tem prioridade
2. **createdAt mais antigo** → quem se inscreveu primeiro (ordem de chegada)

### 9.4 Round-Robin por Cantor

Se um cantor tem várias músicas na fila:
- Apenas a **primeira música** (por data de criação) participa da ordenação principal
- As demais são **intercaladas** após a ordenação (alternando entre cantores)
- Isso garante que um cantor com muitas músicas não monopolize a fila

### 9.5 Override do Coordenador

- Entradas com `priority < 0` são tratadas como overrides manuais
- Mantidas no **topo da fila**, acima de todas as entradas regulares
- Não sofrem penalidades do algoritmo
- Indicador visual: ⚡ PRIORIDADE

### 9.6 Sessão e Histórico

- O histórico de "músicas cantadas" (songsSung) é calculado a partir da tabela `performances`
- Apenas performances da **sessão atual** são contabilizadas (filtradas por `session_started_at`)
- Ao resetar o evento, o `session_started_at` é atualizado, zerando efetivamente todos os contadores
- Cada instância tem seu próprio histórico isolado (filtrado por `karaoke_instance_id`)

### 9.7 Persistência

- As prioridades calculadas são salvas no campo `priority` da tabela `waitlist`
- O rebalanceamento ocorre:
  - Quando uma nova inscrição regular é adicionada
  - Quando um cantor termina de cantar (markAsDone)
  - Quando solicitado manualmente (forceRebalance)

---

## 10. Sistema de Votação e Ranking

### Votação
- Cada apresentação ativa recebe votos dos participantes
- Notas de **0 a 10** via slider no celular
- **1 voto por dispositivo** por apresentação (controlado por `device_id`)
- Proteção contra voto duplicado (constraint no banco)
- Cantor pode **optar por não receber votos** (allow_voting = false)
- Votos resetados se o coordenador trocar o vídeo durante a apresentação

### Ranking
- Calculado automaticamente: `nota_media` = média de todos os votos da performance
- `total_votos` = quantidade de votos recebidos
- Ranking da noite: ordenado por nota média (maior primeiro)
- **Ranking mensal global**: view materializada `monthly_ranking` que inclui score global
- Confetti visual para performances com nota ≥ 9.0 ou novo recorde

---

## 11. Sistema de Sessões e Reset de Evento

### session_started_at
- Campo na tabela `event_settings` que marca o início da sessão atual
- Usado para filtrar performances e calcular histórico apenas da sessão ativa
- Atualizado ao resetar o evento

### Reset de Evento
O coordenador pode resetar o evento, o que:
1. Exclui todas as entradas da waitlist da instância
2. Encerra todas as performances ativas
3. Exclui todos os votos da instância
4. Atualiza `session_started_at` para `now()`
5. Opcionalmente arquiva o ranking atual em `event_archives`

### Isolamento entre Instâncias
- Cada coordenador tem sua própria instância (`karaoke_instance_id`)
- Dados de fila, performances e votos são isolados por instância
- Um cantor que participou em uma instância começa "do zero" em outra

---

## 12. Multi-Idioma

O sistema suporta 6 idiomas:
- 🇧🇷 Português (padrão)
- 🇩🇪 Deutsch (Alemão)
- 🇬🇧 English (Inglês)
- 🇪🇸 Español (Espanhol)
- 🇹🇷 Türkçe (Turco)
- 🇯🇵 日本語 (Japonês)

O seletor de idioma está disponível em todas as telas. A escolha é persistida localmente.

---

## 13. Vídeos Explicativos e Manual

### Página "Manual de Uso" (`/manual`)
Dividido em duas abas:
1. **Manual do Coordenador**: passos para gerenciar o evento + vídeo tutorial
2. **Manual do Usuário**: como se inscrever, votar e ver ranking + vídeo tutorial

### Página "Como Funciona" (`/como-funciona`)
Explica o fluxo em 6 passos visuais com ícones.

### Página "Testar Grátis" (`/testar`)
- Alerta sobre o tempo limitado (1 hora)
- Vídeos explicativos (coordenador e participante)
- Checklist de preparação
- Confirmação antes de iniciar

### Vídeos do Site (gerenciados pelo admin)
| Chave do Vídeo | Localização |
|----------------|-------------|
| `hero_video` | Seção Hero da landing page |
| `music_variety` | Seção de variedade musical |
| `tutorial_coordinator` | Manual e página de teste |
| `tutorial_participant` | Manual e página de teste |

Quando nenhum vídeo está configurado, exibe placeholder com logo e mensagem "Em breve vídeo explicativo".

---

## 14. Arquitetura Técnica

### Stack
- **Frontend**: React 18 + TypeScript + Vite
- **Estilização**: Tailwind CSS + shadcn/ui
- **Animações**: Framer Motion
- **Backend**: Supabase (Lovable Cloud)
- **Banco de dados**: PostgreSQL (via Supabase)
- **Autenticação**: Supabase Auth (email/senha)
- **Realtime**: Supabase Realtime (postgres_changes)
- **Edge Functions**: Deno (Supabase Edge Functions)
- **Pagamentos**: Stripe (checkout, webhooks, assinaturas)
- **Busca de vídeos**: YouTube Data API v3 (via edge function + cache)

### Tabelas Principais do Banco
| Tabela | Descrição |
|--------|-----------|
| `karaoke_instances` | Instâncias de karaokê (uma por coordenador) |
| `waitlist` | Fila de espera (cantores aguardando) |
| `performances` | Apresentações (ativas e encerradas) |
| `votes` | Votos dos participantes |
| `event_settings` | Configurações do evento (inscrições abertas, session_started_at) |
| `participants` | Participantes registrados por instância |
| `coordinator_requests` | Solicitações de novos coordenadores |
| `user_roles` | Papéis dos usuários (admin, coordinator, host) |
| `subscription_plans` | Planos de assinatura |
| `discount_coupons` | Cupons de desconto |
| `payment_records` | Registros de pagamento |
| `site_videos` | Vídeos do site (gerenciados pelo admin) |
| `site_images` | Imagens do site |
| `site_contacts` | Contatos do site (WhatsApp, Instagram, etc.) |
| `hero_carousel_slides` | Slides do carrossel da hero section |
| `event_archives` | Rankings arquivados |
| `instruction_videos` | Vídeos instrucionais para inserção entre performances |
| `youtube_search_cache` | Cache de buscas YouTube |

### Rotas Principais
| Rota | Página | Acesso |
|------|--------|--------|
| `/` | Landing page (marketing) | Público |
| `/como-funciona` | Como funciona | Público |
| `/depoimentos` | Depoimentos | Público |
| `/manual` | Manual de uso | Público |
| `/testar` | Teste grátis | Público |
| `/planos` | Planos e preços | Público |
| `/checkout/:planId` | Checkout (Stripe) | Público |
| `/app` | Login do coordenador | Público |
| `/app/login` | Login alternativo | Público |
| `/app/cadastro` | Cadastro trial | Público |
| `/app/host` | Painel do coordenador | Autenticado (coordinator) |
| `/app/host/:instanceCode` | Painel por código (admin) | Autenticado (admin) |
| `/app/admin` | Painel administrativo | Autenticado (admin) |
| `/app/vote/:instanceCode` | Votação | Registro por dispositivo |
| `/app/inscricao/:instanceCode` | Inscrição | Registro por dispositivo |
| `/app/ranking/:instanceCode` | Ranking | Público |
| `/app/guia` | Guia do evento | Autenticado (coordinator) |

### Edge Functions
| Função | Descrição |
|--------|-----------|
| `youtube-search` | Busca vídeos no YouTube com cache |
| `youtube-video-duration` | Obtém duração de vídeos |
| `create-checkout` | Cria sessão de checkout Stripe |
| `stripe-webhook` | Processa webhooks do Stripe |
| `create-coordinator` | Cria coordenador e instância |
| `send-credentials-email` | Envia credenciais por email |
| `register-trial` | Registra trial gratuito |
| `change-coordinator-password` | Altera senha do coordenador |
| `request-password-reset` | Solicita reset de senha |
| `reset-coordinator-password` | Reseta senha do coordenador |
| `verify-reset-token` | Verifica token de reset |
| `send-bulk-message` | Envia mensagens em massa |
| `force-logout` | Força logout de coordenador |
| `clear-session-flag` | Limpa flag de sessão |
| `api-keys` | Gerencia chaves API |
| `get-secrets-status` | Status dos segredos configurados |
| `update-secret` | Atualiza segredo |
| `test-stripe-key` | Testa chave Stripe |

---

## 15. Links Úteis

| Recurso | Link |
|---------|------|
| **Site principal** | https://ismakaraoke.lovable.app |
| **Como funciona** | https://ismakaraoke.lovable.app/como-funciona |
| **Planos** | https://ismakaraoke.lovable.app/planos |
| **Manual** | https://ismakaraoke.lovable.app/manual |
| **Testar grátis** | https://ismakaraoke.lovable.app/testar |
| **Depoimentos** | https://ismakaraoke.lovable.app/depoimentos |
| **Login coordenador** | https://ismakaraoke.lovable.app/app |

---

## 16. Benefícios do Sistema

### Para Organizadores
- Controle total pelo painel digital
- Fila organizada automaticamente (sem papelzinho)
- QR Code para acesso instantâneo dos participantes
- Votação automática pelo celular
- Ranking em tempo real

### Para Participantes
- Acesso rápido via QR Code (sem instalar app)
- Busca fácil de músicas
- Votação interativa e divertida
- Acompanhamento do ranking em tempo real
- Experiência moderna e envolvente

---

## 17. Depoimentos

> "O Mamute Karaokê transformou completamente nossos eventos! Os participantes adoram e ficam muito mais engajados." — **Ana Paula Silva**, Organizadora de Eventos

> "Antes era uma confusão com papelzinho. Agora está tudo organizado pelo celular. O público fica mais tempo no estabelecimento." — **Carlos Eduardo**, Dono de Bar

> "Usei no aniversário da minha filha e foi sucesso total! As crianças e adultos se divertiram demais votando." — **Maria Fernanda**, Festa de Aniversário

> "Ferramenta essencial para qualquer profissional de karaokê. Fácil de usar e os clientes amam a experiência interativa." — **Roberto Santos**, DJ Profissional

> "Usamos nos eventos da comunidade e todos participam. O ranking deixa tudo mais animado e divertido!" — **Juliana Costa**, Coordenadora de Igreja

> "Perfeito para confraternizações! O sistema de votação engajou toda a equipe de forma descontraída." — **Pedro Henrique**, Evento Corporativo

---

## 18. Perguntas Frequentes (FAQ)

### Preciso instalar algum aplicativo?
Não! O Mamute Karaokê funciona 100% no navegador. Basta escanear o QR Code.

### Quantas pessoas podem participar?
Não há limite de participantes. O sistema escala automaticamente.

### Como funciona a fila?
O sistema usa um algoritmo inteligente (Fila Justa PRO) que prioriza quem cantou menos e quem espera há mais tempo, evitando que o mesmo cantor cante seguido.

### Posso usar em qualquer dispositivo?
Sim! Funciona em celulares, tablets e computadores — qualquer dispositivo com navegador e internet.

### O coordenador pode alterar a ordem da fila?
Sim! O coordenador tem controle total e pode mover cantores para cima/baixo ou inserir alguém como próximo.

### Cada evento tem dados separados?
Sim! Cada instância é completamente isolada. Ao resetar o evento, todos os contadores são zerados.

### O que acontece quando o tempo do plano expira?
O coordenador perde acesso ao painel e vê uma mensagem para renovar o plano.

### Posso usar sem telão?
Sim! O telão é opcional. O coordenador pode gerenciar tudo pelo computador/celular.

### O sistema funciona offline?
Não. É necessário conexão com a internet para todas as funcionalidades.

### Como faço para ser coordenador?
Acesse o site e clique em "Tenho Interesse" na página de login, ou compre um plano diretamente.

---

*Documento gerado automaticamente a partir do código-fonte do Mamute Karaokê. Para uso interno e integração com agentes de IA.*
