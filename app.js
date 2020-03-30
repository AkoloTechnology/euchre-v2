var express = require("express");
var path = require("path");
var bodyParser = require("body-parser");
var app = express();

function RandomString(depth) {
  depth = Math.floor(depth / 2);
  return (
    Math.random()
      .toString(36)
      .substring(2, depth + 2) +
    Math.random()
      .toString(36)
      .substring(2, depth + 2)
  );
}

function Shuffle(array) {
  shuffle_depth = 100;
  var array_size = array.length;
  for (var x = 0; x < shuffle_depth; x++) {
    var i = Math.floor(Math.random() * array_size);
    var j = Math.floor(Math.random() * array_size);
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

// --------------------------------------------- States_Handler ---------------------------------------------

class States_Handler {
  constructor(game) {
    this.states_json = [
      this.CreateNewBlockObject(
        this.CreateGameInfoObject(game),
        this.CreatePlayersObject(),
        this.CreateHandsObject(),
        this.CreateScoreObject(),
        this.CreateDefaultStatesObject()
      )
    ];
    this.branch_counter = 1;
  }

  CreateGameInfoObject(game) {
    return { name: game.name, id: game.id, started: false };
  }

  CreatePlayersObject() {
    return [
      {
        name: "player1",
        id: "player1id",
        partner_id: "",
        team_id: "",
        position: 0
      },
      {
        name: "player2",
        id: "player2id",
        partner_id: "",
        team_id: "",
        position: 1
      },
      {
        name: "player3",
        id: "player3id",
        partner_id: "",
        team_id: "",
        position: 2
      },
      {
        name: "player4",
        id: "player4id",
        partner_id: "",
        team_id: "",
        position: 3
      }
    ];
  }

  CreateScoreObject() {
    return {
      record: 0,
      team1: {
        name: "Red Team",
        id: "team1",
        match_points: 0,
        wins: 0,
        player1_id: "",
        player2_id: ""
      },
      team2: {
        name: "Blue Team",
        id: "team2",
        match_points: 0,
        wins: 0,
        player1_id: "",
        player2_id: ""
      }
    };
  }

  CreateHandsObject() {
    return [
      { player_id: "player1id", hand: [] },
      { player_id: "player2id", hand: [] },
      { player_id: "player3id", hand: [] },
      { player_id: "player4id", hand: [] }
    ];
  }

  CreateDefaultStatesObject() {
    return {
      trump: 0,
      flippedcard: null,
      team_called_trump_id: "",
      lead_card: null,
      round_starter_id: "",
      current_player_id: "",
      current_state: 0,
      goes_alone_id: "",
      played_cards: [],
      skipped_player_id: "",
      highest_card: {
        player_id: "",
        card: null
      },
      dealer: { position: 0, player_id: "" }
    };
  }

  CreateNewBlockObject(gameinfo, players, hands, score, states) {
    return {
      id: this.branch_counter,
      gameinfo: gameinfo,
      players: players,
      hands: hands,
      score: score,
      states: states
    };
  }

  AddBranch(branch_object) {
    if (this.states_json.length == 0) return null;
    this.branch_counter++;
    var temp_object = JSON.parse(JSON.stringify(branch_object));
    temp_object.id = this.branch_counter;
    return this.states_json.push(temp_object);
  }

  GetLast() {
    if (this.states_json.length == 0) return null;
    return this.states_json[this.states_json.length - 1];
  }
}

// --------------------------------------------- Euchre_Game ---------------------------------------------

class Euchre_Game {
  constructor() {
    this.name = "default";
    this.id = RandomString(36);
    this.maindeck = [];
    this.dealer_player = null;
    this.second_player = null;
    this.third_player = null;
    this.fourth_player = null;
    this.users = [];
    this.states_handler = new States_Handler(this);
    this.master_states = this.states_handler.GetLast();
    this.state = this.master_states.states;
    this.player = this.master_states.players;
    this.score = this.master_states.score;
    this.hand = this.master_states.hands;
    this.state.current_state = 1; // set game to waiting for game to start
  }

  AddBranch() {
    return this.states_handler.AddBranch(this.master_states);
  }

  CreateEuchreDeck() {
    var temp_deck = [];

    for (var card_suit = 1; card_suit <= 4; card_suit++) {
      for (var card_value = 9; card_value <= 13; card_value++) {
        var temp_card = {};
        temp_card.suit = card_suit;
        temp_card.value = card_value;
        temp_deck.push(temp_card);
      }
      var temp_ace = {};
      temp_ace.suit = card_suit;
      temp_ace.value = 1;
      temp_deck.push(temp_ace);
    }
    this.maindeck = temp_deck;
  }

  GetPlayerByID(player_id) {
    for (var i = 0; i < 4; i++) {
      if (this.player[i].id == player_id) return this.player[i];
    }
    return null;
  }

  GetPlayerByDealerPosition(position) {
    return this.player[(this.state.dealer.position + position) % 4];
  }

  GetTeamByPlayerID(player_id) {
    if (this.score.team1.player1_id == player_id) return this.score.team1.id;
    if (this.score.team1.player2_id == player_id) return this.score.team1.id;
    if (this.score.team2.player1_id == player_id) return this.score.team2.id;
    if (this.score.team2.player2_id == player_id) return this.score.team2.id;
  }

  GetTeamByID(team_id) {
    if (this.score.team1.id == team_id) return this.score.team1;
    if (this.score.team2.id == team_id) return this.score.team2;
  }

  Dealer() {
    return this.player[this.state.dealer.position];
  }

  Second() {
    return this.player[(this.state.dealer.position + 1) % 4];
  }

  Third() {
    return this.player[(this.state.dealer.position + 2) % 4];
  }

  Fourth() {
    return this.player[(this.state.dealer.position + 3) % 4];
  }

  AdvanceCurrentPlayer() {
    if (this.state.current_player_id == this.Dealer().id) {
      if (this.state.skipped_player_id == this.Second().id)
        this.state.current_player_id = this.Third().id;
      else this.state.current_player_id = this.Second().id;
    } else if (this.state.current_player_id == this.Second().id) {
      if (this.state.skipped_player_id == this.Third().id)
        this.state.current_player_id = this.Fourth().id;
      else this.state.current_player_id = this.Third().id;
    } else if (this.state.current_player_id == this.Third().id) {
      if (this.state.skipped_player_id == this.Fourth().id)
        this.state.current_player_id = this.Dealer().id;
      else this.state.current_player_id = this.Fourth().id;
    } else if (this.state.current_player_id == this.Fourth().id) {
      if (this.state.skipped_player_id == this.Dealer().id)
        this.state.current_player_id = this.Second().id;
      else this.state.current_player_id = this.Dealer().id;
    }
  }

  Current_Player() {
    return this.GetPlayerByID(this.state.current_player_id);
  }

  GetHandByID(player_id) {
    for (var i = 0; i < 4; i++) {
      if (this.hand[i].player_id == player_id) return this.hand[i].hand;
    }
    return null;
  }

  ShufflePlayers() {
    Shuffle(this.player);
    for (var i = 0; i < 4; i++) this.player[i].position = i;
    this.score.team1.player1_id = this.player[0].id;
    this.player[0].team_id = this.score.team1.id;
    this.score.team2.player1_id = this.player[1].id;
    this.player[1].team_id = this.score.team2.id;
    this.score.team1.player2_id = this.player[2].id;
    this.player[2].team_id = this.score.team1.id;
    this.score.team2.player2_id = this.player[3].id;
    this.player[3].team_id = this.score.team2.id;
    this.state.dealer.player_id = this.player[this.state.dealer.position].id;
  }

  SortUsersByPosition() {
    var temp_users = [];
    for (var i = 0; i < 4; i++)
      temp_users[this.users[i].player.position] = this.users[i];
    this.users = temp_users;
  }

  StartNewGame() {
    // random who starts as dealer
    this.master_states.gameinfo.started = true;
    this.state.dealer.position = Math.floor(Math.random() * 4);
    this.ShufflePlayers();
    this.SortUsersByPosition();
    this.AddBranch();
    this.StartRound();
  }

  AdvanceDealer() {
    this.dealer = (this.dealer + 1) % 4;
  }

  DrawCards(player, amount) {
    for (var i = 0; i < amount; i++) {
      this.GetHandByID(player.id).push(this.maindeck.pop());
    }
  }

  DealCards() {
    // reset hands
    for (var i = 0; i < 4; i++) this.player[i].hand = [];

    // create new deck and shuffle
    this.CreateEuchreDeck();
    Shuffle(this.maindeck);

    // deals 3,2,3,2
    this.DrawCards(this.Second(), 3);
    this.DrawCards(this.Third(), 2);
    this.DrawCards(this.Fourth(), 3);
    this.DrawCards(this.Dealer(), 2);

    // deals 2,3,2,3
    this.DrawCards(this.Second(), 2);
    this.DrawCards(this.Third(), 3);
    this.DrawCards(this.Fourth(), 2);
    this.DrawCards(this.Dealer(), 3);

    this.state.flippedcard = this.maindeck.pop();
  }

  StartRound() {
    this.AdvanceDealer();
    this.DealCards();
    this.state.current_player_id = this.Second().id;
    this.UpdateState(11);
  }

  /*
    json object for request
    request_info: {
      game_id: id,
      player_id: id,
      state: state
    },
    input: {
      card: card,
      question: true/false, (yes=true,no=false)}

    error response
    response_info: {
      code: number,
      message: text
    }
  */

  InverseSuit(suit) {
    if (suit == 1) return 2;
    if (suit == 2) return 1;
    if (suit == 3) return 4;
    if (suit == 4) return 3;
  }

  HandHasAnyOtherSuit(hand, suit) {
    for (var i = 0; i < hand.length; i++) if (hand[i].suit == suit) return true;
    return false;
  }

  HandHasSuit(hand, suit) {
    for (var i = 0; i < hand.length; i++) if (hand[i].suit == suit) return true;
    return false;
  }

  UpdateState(state_number) {
    this.state.current_state = state_number;
    this.AddBranch();
  }
  // rip
  NoFaceAceOrTrumpCheck() {
    for (var i = 0; i < this.player.length; i++) {
      var temp_hand = this.GetHandByID(this.player[i].id);
      for (var y = 0; y < temp_hand.length; y++)
        if (
          temp_hand[y].suit == this.state.trump ||
          temp_hand[y].value == 1 ||
          temp_hand[y].value > 10
        ) {
          this.state.current_player_id = this.Second().id;
          this.state.round_starter_id = this.Second().id;
          this.UpdateState(22);
          return false;
        }
    }
    this.state.current_player_id = this.player[i].id;
    this.UpdateState(21);
    return true;
  }

  RequestGameLogic(request) {
    // if request is invalid, return null
    if (
      //request.game_id != this.id ||
      request.player_id != this.state.current_player_id ||
      request.states != this.state.current_state
    )
      return {
        code: 0,
        message:
          "Invalid header! Player ID of turn: " +
          this.state.current_player_id +
          " Game State " +
          this.state.current_state
      };
    switch (this.state.current_state) {
      case 11:
        // Does user want to order card up?
        if (request.question) {
          // Does user have a card of the same suit as the flipped card
          if (
            this.HandHasSuit(
              this.GetHandByID(this.state.current_player_id),
              this.state.flippedcard.suit
            )
          ) {
            // User's team called trump for round
            this.state.team_called_trump_id = this.Current_Player().team_id;
            // If User is dealer's partner, they must go alone (Canadian Rule)
            if (this.Third().id == this.state.current_player_id) {
              this.state.goes_alone_id = this.state.current_player_id;
              this.state.skipped_player_id = this.Dealer().id;
              this.state.trump = this.state.flippedcard.suit;
              this.state.team_called_trump_id = this.Current_Player().team_id;
              this.NoFaceAceOrTrumpCheck(); // Check to see if anyone has no ace/face/trump
              return {
                code: 1,
                message: "Case11: " + this.Current_Player().name + " went alone"
              };
            } else {
              // Any other user
              this.state.trump = this.state.flippedcard.suit;
              this.state.team_called_trump_id = this.Current_Player().team_id;
              this.state.current_player_id = this.Dealer().id;
              this.UpdateState(19); // Dealer swaps a card
              return {
                code: 1,
                message:
                  "Case11: " + this.Current_Player().name + " ordered up card"
              };
            }
          } // If they don't have suit, don't do anything
          else
            return {
              code: 0,
              message: "Case11: You can't order up since you don't have suit!"
            };
        } else if (request.question == false) {
          // User does not want to order up card
          // If the user is the dealer, go to next phase
          if (this.Current_Player() == this.Dealer()) {
            this.state.current_player_id = this.Second().id;
            this.UpdateState(12); // Choose trump phase
            return {
              code: 1,
              message:
                "Case11: Everyone passed, card flipped down, now in choose trump phase"
            };
          } else {
            // Any other user, advance player
            this.AdvanceCurrentPlayer();
            this.UpdateState(11);
            return {
              code: 1,
              message: "Case11: User passed on ordering up flipped card"
            };
          }
        } else
          return {
            code: 0,
            message: "Case11: Error, can't read null question"
          };

      case 12: // Choose suit
        if (request.question) {
          // Stick the deal rules
          if (this.Current_Player() == this.Dealer())
            return {
              code: 0,
              message:
                "Case12: Dealer can not pass on choosing suit (Stick the dealer rules)"
            };
          else {
            // Any other user, advance player
            this.AdvanceCurrentPlayer();
            this.UpdateState(12);
            return {
              code: 1,
              message: "Case12: User passed on choosing suit"
            };
          }
        } else {
          if (request.card == null)
            return {
              code: 0,
              message: "Case12: Card can't be null"
            };
          // Check if user has atleast one card of the same suit as suit he chose
          if (
            this.HandHasSuit(
              this.GetHandByID(this.state.current_player_id),
              request.card.suit
            )
          ) {
            // Check if choosen suit is the same as previous turned down suit
            if (this.state.flippedcard.suit == request.card.suit) {
              // If they have any other suit, they have to select it or pass
              if (
                this.HandHasAnyOtherSuit(
                  this.GetHandByID(this.state.current_player_id),
                  request.card.suit
                )
              )
                return {
                  code: 0,
                  message: "Case12: Must choose valid suit or pass"
                };
              // If it is dealer, and they have nothing other than the flipped down suit, it becomes trump
              else if (this.Current_Player() == this.Dealer()) {
                this.state.trump = request.card.suit;
                this.state.team_called_trump_id = this.Current_Player().team_id;
                this.UpdateState(20);
                return {
                  code: 1,
                  message:
                    "Case12: Dealer chose " +
                    request.card.suit +
                    " as trump (Stick the Dealer)"
                };
              } else
                return {
                  code: 0,
                  message: "Case12: No valid suits, you must pass"
                };
            } else {
              // Suit is valid to play
              this.state.trump = request.card.suit;
              this.state.team_called_trump_id = this.Current_Player().team_id;
              this.UpdateState(20);
              return {
                code: 1,
                message:
                  "Case12: User chose " +
                  request.card.suit +
                  " as trump (Stick the Dealer)"
              };
            }
          } else
            return {
              code: 0,
              message: "Case12: You must choose a suit that you have"
            };
        }

      // todo: can the dealer toss his last card of the same suit as flipped card?
      case 19: {
        var dealer_hand = this.GetHandByID(this.Dealer().id);
        for (var i = 0; i < dealer_hand.length; i++) {
          if (
            dealer_hand[i].suit == request.card.suit &&
            dealer_hand[i].value == request.card.value
          ) {
            this.maindeck.push(request.card);
            dealer_hand.splice(i, 1);
            dealer_hand.push(this.state.flippedcard);
            this.UpdateState(20);
            return {
              code: 1,
              message: "Case19: Dealer replaced a card"
            };
          }
        }
        return {
          code: 0,
          message: "Case19: Dealer chose an invalid card to replace"
        };
      }

      case 20: // Option to go alone
        if (request.question) {
          this.state.goes_alone_id = this.state.current_player_id;
          this.state.skipped_player_id = this.GetPlayerByDealerPosition(
            this.Current_Player().position + 2
          ).id;
          this.NoFaceAceOrTrumpCheck();
          return {
            code: 1,
            message:
              "Case20: " +
              this.GetPlayerByID(request.player_id).name +
              " is going alone"
          };
        } else if (request.question == false) {
          this.NoFaceAceOrTrumpCheck();
          return {
            code: 1,
            message:
              "Case20: " +
              this.GetPlayerByID(request.player_id).name +
              " is not going alone"
          };
        } else
          return {
            code: 0,
            message: "Case20: Null response case 20"
          };
      case 21:
        if (request.question) {
          this.StartRound();
          return {
            code: 1,
            message: "Case21: No Face Ace or Trump so game restarted"
          };
        } else {
          this.NoFaceAceOrTrumpCheck();
          return {
            code: 1,
            message: "Case21: Player passed on restarting game"
          };
        }

      case 22: {
        // todo: make sure card is valid
        this.state.highest_card.player_id = this.state.current_player_id;
        this.state.highest_card.card = request.card;
        this.state.lead_card = request.card;
        this.state.played_cards.push({
          player_id: this.state.current_player_id,
          card: request.card
        });
        this.AdvanceCurrentPlayer();
        this.UpdateState(23);
        return {
          code: 1,
          message: "Case22: Round stater lead round"
        };
      }
      case 23:
        {
          if (request.card.suit != this.state.lead_card.suit) {
            if (
              this.HandHasSuit(
                this.GetHandByID(this.state.current_player_id),
                this.state.lead_card.suit
              )
            )
              return {
                code: 0,
                message:
                  "Case23: Must play card that matches lead suit if possible"
              };
            this.state.played_cards.push({
              player_id: this.state.current_player_id,
              card: request.card
            });
            // calculate if card if of higher value

            // if played card is trump and previous highest card wasn't, new card is winning card
            // played bower
            if (
              request.card.suit == this.state.trump &&
              request.card.value == 11
            ) {
              this.state.highest_card.player_id = this.state.current_player_id;
              this.state.highest_card.card = request.card;
              this.AdvanceCurrentPlayer();
              if (request.card.suit)
                if (this.state.current_player_id == this.round_starter_id) {
                  this.UpdateState(24);
                  return {
                    code: 1,
                    message: "Case23: New highest card, round has ended"
                  };
                }
              return {
                code: 1,
                message: "Case23: New highest card, round continues"
              };
            }

            if (
              request.card.suit == this.InverseSuit(this.state.trump) &&
              request.card.value == 11 &&
              !(
                this.state.highest_card.card.suit == this.state.trump &&
                this.state.highest_card.card.value == 11
              )
            ) {
              this.state.highest_card.player_id = this.state.current_player_id;
              this.state.highest_card.card = request.card;
              this.AdvanceCurrentPlayer();
              if (request.card.suit)
                if (this.state.current_player_id == this.round_starter_id) {
                  this.UpdateState(24);
                  return {
                    code: 1,
                    message: "Case23: New highest card, round has ended"
                  };
                }
              return {
                code: 1,
                message: "Case23: New highest card, round continues"
              };
            }

            if (
              request.card.suit == this.state.trump &&
              this.state.highest_card.card.suit != this.state.trump
            ) {
              this.state.highest_card.player_id = this.state.current_player_id;
              this.state.highest_card.card = request.card;
              this.AdvanceCurrentPlayer();
              if (request.card.suit)
                if (this.state.current_player_id == this.round_starter_id) {
                  this.UpdateState(24);
                  return {
                    code: 1,
                    message: "Case23: New highest card, round has ended"
                  };
                }
              return {
                code: 1,
                message: "Case23: New highest card, round continues"
              };
            }
            if (
              request.card.suit != this.state.trump &&
              this.state.highest_card.card.suit == this.state.trump
            ) {
              this.AdvanceCurrentPlayer();
              if (this.state.current_player_id == this.round_starter_id) {
                this.UpdateState(24);
                return {
                  code: 1,
                  message:
                    "Case23: Card played, no new highest card, round has ended"
                };
              }
              return {
                code: 1,
                message:
                  "Case23: Card played, no new highest card, round continues"
              };
            }
            if (request.card.suit != this.state.lead_card.suit) {
              this.AdvanceCurrentPlayer();
              if (this.state.current_player_id == this.round_starter_id) {
                this.UpdateState(24);
                return {
                  code: 1,
                  message:
                    "Case23: Card played, no new highest card, round has ended"
                };
              }
              return {
                code: 1,
                message:
                  "Case23: Card played, no new highest card, round continues"
              };
            }
            if (request.card.value > this.state.highest_card.card.value) {
              this.state.highest_card.player_id = this.state.current_player_id;
              this.state.highest_card.card = request.card;
              this.AdvanceCurrentPlayer();
              if (request.card.suit)
                if (this.state.current_player_id == this.round_starter_id) {
                  this.UpdateState(24);
                  return {
                    code: 1,
                    message: "Case23: New highest card, round has ended"
                  };
                }
              return {
                code: 1,
                message: "Case23: New highest card, round continues"
              };
            }
            this.AdvanceCurrentPlayer();
            if (this.state.current_player_id == this.round_starter_id) {
              this.UpdateState(24);
              return {
                code: 1,
                message:
                  "Case23: Card played, no new highest card, round has ended"
              };
            }
            return {
              code: 1,
              message:
                "Case23: Card played, no new highest card, round continues"
            };
          }
        }
        break;
      default:
        console.log("Case " + this.state.current_state + " is unknown");
    }
  }

  IsUserInGame(user_id) {
    for (var i = 0; i < this.users.length; i++) {
      if (this.users[i].id == user_id) return true;
    }
    return false;
  }

  AddUser(user) {
    if (this.users.length > 4) {
      console.log("Game->AddUser: Too many users in games");
      return null;
    }
    if (user == null) {
      console.log("Game->AddUser: Can't add null user");
      return null;
    }
    if (this.IsUserInGame(user.id)) {
      console.log("Game->AddUser: User already in game");
      return null;
    }
    user.game = this;
    // todo: properly check for next free player
    user.player = this.player[this.users.length];
    user.player.name = user.name;
    this.users.push(user);
    return user;
  }
}

// --------------------------------------------- User ---------------------------------------------

class User {
  constructor() {
    this.name = "default";
    this.player = null;
    this.game = null;
    this.id = 0;
  }

  CreateUserID() {
    this.id = RandomString(8);
  }
}

// --------------------------------------------- Game Handler ---------------------------------------------

class Game_Handler {
  constructor() {
    this.game = new Euchre_Game();
    this.users = [];
  }

  CreateUser(user_name) {
    var temp_user = new User();
    temp_user.CreateUserID();
    temp_user.name = user_name;
    this.users.push(temp_user);
    return temp_user;
  }

  GetUserByID(user_id) {
    if (user_id == null) {
      console.log("user_id is null");
      return null;
    }
    for (var i = 0; i < this.users.length; i++) {
      if (this.users[i].id == user_id) return this.users[i];
    }
    console.log(
      "Game_Handler->GetUserByID: " + user_id + " is not a valid user id"
    );
    return null;
  }

  AddUserToGame(user) {
    return this.game.AddUser(user);
  }

  // todo: add game to list?
  CreateNewGame() {
    this.game = new Euchre_Game();
  }

  // todo: are argument to tell which game to start
  StartNewGame() {
    if (this.game.master_states.gameinfo.started) {
      console.log("Game_Handler->StartNewGame: Game already started");
      return false;
    }
    if (this.game.users.length >= 4) {
      this.game.StartNewGame();
      console.log("Game_Handler->StartNewGame: Game started");
      return true;
    }
    console.log("Game_Handler->StartNewGame: Not enough players to start");
    return false;
  }

  GetPlayerName(user_id) {
    var temp_user = this.GetUserByID(user_id);
    return temp_user.name;
  }

  GetPlayerHandJSON(user_id) {
    if (user_id == null) console.log("user_id is null");
    else if (this.GetUserByID(user_id) == null) console.log("user is null");
    else if (this.GetUserByID(user_id).player == null)
      console.log("player is null");
    else return this.game.GetHandByID(this.GetUserByID(user_id).player.id);
  }

  // todo: request gameid
  GetGameInfoJSON() {
    return this.game.states_handler.GetLast().gameinfo;
  }

  // todo: request gameid
  GetStatesJSON() {
    return this.game.states_handler.GetLast().states;
  }

  // todo: request gameid
  GetPlayersJSON() {
    return this.game.states_handler.GetLast().players;
  }

  // todo: request gameid
  GetScoreJSON() {
    return this.game.states_handler.GetLast().score;
  }

  GetJSONVersion() {
    return { version: this.game.states_handler.GetLast().id };
  }

  RequestGameLogic(request) {
    return this.game.RequestGameLogic(request);
  }
}

// --------------------------------------------- Web Server ---------------------------------------------

var game_handler = new Game_Handler();
game_handler.CreateNewGame();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", function(req, res) {
  res.sendFile(path.join(__dirname + "/index.html"));
});

app.get("/game.js", function(req, res) {
  res.sendFile(path.join(__dirname + "/game.js"));
});

app.get("/styles.css", function(req, res) {
  res.sendFile(path.join(__dirname + "/styles.css"));
});

app.post("/createuser", function(req, res) {
  var temp_user = game_handler.CreateUser(req.body.name);
  res.send(temp_user.id);
});

app.get("/getplayerid", function(req, res) {
  var user = game_handler.GetUserByID(req.headers.user_id);
  res.send(user.player.id);
});

app.get("/joingame", function(req, res) {
  var user = game_handler.GetUserByID(req.headers.user_id);
  if (game_handler.AddUserToGame(user)) {
    res.json(game_handler.GetGameInfoJSON());
  } else {
    console.log("Couldn't join game.");
    res.status(500).send("Error joining game");
  }
});

app.get("/startnewgame", function(req, res) {
  res.send(game_handler.StartNewGame());
});

app.get("/gethand", function(req, res) {
  res.json(game_handler.GetPlayerHandJSON(req.headers.user_id));
});

app.get("/getstatedata", function(req, res) {
  res.json(game_handler.GetStatesJSON());
});

app.get("/getplayers", function(req, res) {
  res.json(game_handler.GetPlayersJSON());
});

app.get("/getscore", function(req, res) {
  res.json(game_handler.GetScoreJSON());
});

app.get("/checkforupdates", function(req, res) {
  res.json(game_handler.GetJSONVersion());
});

app.post("/sendrequest", function(req, res) {
  console.log(req.body);
  if (game_handler.GetUserByID(req.body.user_id) == null)
    res.status(500).send("User is null");
  else if (
    game_handler.GetUserByID(req.body.user_id).player.id != req.body.player_id
  )
    res.status(500).send("User's player is not correct");
  else {
    var temp_response = game_handler.RequestGameLogic(req.body);
    console.log(temp_response);
    res.send(temp_response);
  }
});

app.listen(3000);
