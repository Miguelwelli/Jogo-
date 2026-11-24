# NEXUS WZ

Jogo de tiro low-poly para navegador, com campo de treinamento, arena 1x1 e um estúdio de skins.

## Como jogar

- No lobby, toque no cartão **Modo de jogo** para escolher o treinamento ou a **Arena dos Gladiadores**.
- Na arena, selecione a dificuldade e escolha **Jogar contra bot** para uma partida solo. O duelo é melhor de três rounds. O resultado e a dificuldade escolhida ficam salvos no navegador.
- Para jogar online, crie uma sala na aba **Online** e compartilhe o código. Com dois jogadores conectados, o anfitrião escolhe a arena e inicia a partida; o convidado precisa aceitar o convite. O modo online depende da rede, do serviço de sinalização do PeerJS e da compatibilidade de WebRTC entre os dispositivos.
- No treinamento, use o desafio de 60 segundos para acompanhar acertos, precisão e recorde pessoal. Esse recorde fica salvo no navegador.
- Na aba **Operador**, escolha a aparência ou abra o estúdio para criar uma referência de skin. O PNG criado no estúdio não se torna automaticamente um modelo 3D do jogo.

## Controles

- **Celular:** use o joystick e os botões na tela. No treinamento, há um botão para trocar de arma.
- **Teclado e mouse:** WASD para mover, mouse para mirar e atirar, R para recarregar, espaço para pular, C ou Ctrl para deslizar, Q para trocar de arma no treinamento e T para iniciar o desafio de tiro.
- **Controle:** analógicos para mover e mirar; gatilhos para mirar e atirar; X/A para pular, círculo/B para deslizar, quadrado/X para recarregar e triângulo/Y para trocar de arma no treinamento. A seta para cima inicia o desafio. Se o triângulo não funcionar, toque em **CONFIG.** no treinamento e siga as instruções para configurá-lo.
- Contra o bot, o menu de pausa também pausa a contagem entre rounds. **No duelo online, a partida continua enquanto o menu estiver aberto.**

## Desenvolvimento

O jogo é um site estático. Para servir localmente:

```sh
python3 -m http.server 8000
```

Acesse `http://localhost:8000/`. As bibliotecas Three.js e PeerJS e o CSS gerado estão em `assets/`; suas licenças estão em `assets/licenses/`. O modo online ainda precisa de acesso à rede.

Para instalar as ferramentas de desenvolvimento, reconstruir os arquivos locais após alterar classes do Tailwind e executar os testes:

```sh
npm ci
npm run build
npm test
```

Os testes usam DOM e renderizador simulados: eles não substituem testes visuais em navegador, em controles reais ou de conexão entre dois dispositivos.
