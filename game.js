// prettier-ignore
const suits_short = ["null","S", "C", "H", "D"];
// prettier-ignore
const suits_proper = ["null","Spades", "Clubs", "Hearts", "Diamonds"];
// prettier-ignore
const value_short = ["null","A","2","3","4","5","6","7","8","9","D","J","Q","K"];
// prettier-ignore
const value_proper = ["null","Ace","2","3","4","5","6","7","8","9","10","Jack","Queen","King"];

var gameinfo = null;
var players_info = null;
var states = null;
var user_id = null;
var player_id = null;
var user_name = "";
var user_hand = [];
var game_id = 0;
var ingame = false;
var version = 0;
var score_data = null;

function HandHasSuit(suit) {
  for (var i = 0; i < user_hand.length; i++)
    if (user_hand[i].suit == suit) return true;
  return false;
}

function HandHasAnyBesidesSuit(suit) {
  for (var i = 0; i < user_hand.length; i++)
    if (user_hand[i].suit != suit) return true;
  return false;
}

function GetPlayerById(id) {
  for (var i = 0; i < players_info.length; i++)
    if (players_info[i].id == id) return players_info[i];
  return null;
}

function CreateUser() {
  if (user_id != null) {
    alert("You already have a user");
    $("#formbutton").prop("disabled", true);
    return;
  }
  user_name = $("#formname").val();
  $.post("createuser", { name: user_name }, result => {
    document.getElementById("playername").innerHTML = "Name: " + user_name;
    $("#usernameform").hide();
    user_id = result;
  });
}

function GetPlayerID() {
  $.ajax({
    url: "getplayerid",
    type: "GET",
    dataType: "text",
    headers: { user_id: user_id },
    success: function(data) {
      player_id = data;
    }
  });
}

function SendRequest(request) {
  var temp_request = {};
  temp_request.user_id = user_id;
  temp_request.player_id = player_id;
  temp_request.states = states.current_state;
  temp_request.card = request.card != null ? request.card : null;
  temp_request.question = request.question != null ? request.question : null;
  $.ajax({
    type: "POST",
    url: "sendrequest",
    data: JSON.stringify(temp_request),
    contentType: "application/json",
    dataType: "json",
    success: function(data) {
      IntervalUpdate();
      console.log(data);
    }
  });
}

function UpdatePlayerInfo() {
  $.ajax({
    url: "getplayers",
    type: "GET",
    dataType: "json",
    headers: { user_id: user_id },
    success: function(data) {
      // display current users
      players_info = data;
      $("#players").empty();
      $("#players").append("<div>Users:</div>");
      for (var i = 0; i < players_info.length; i++) {
        var temp_dom = $("<div></div>");
        var temp_text = players_info[i].position + 1 + ": ";
        if (players_info[i].id == states.current_player_id)
          temp_text += " cur  -";
        temp_text += players_info[i].name;
        if (players_info[i].id == states.dealer.player_id)
          temp_text += " - Dealer";
        if (players_info[i].id == states.goes_alone_id)
          temp_text += " - going alone";
        temp_text += " - Team: " + players_info[i].team_id;
        temp_dom.text(temp_text);
        if (!!score_data) {
          if (
            players_info[i].id == score_data.team1.player1_id ||
            players_info[i].id == score_data.team1.player2_id
          )
            temp_dom.addClass("redteam");
          if (
            players_info[i].id == score_data.team2.player1_id ||
            players_info[i].id == score_data.team2.player2_id
          )
            temp_dom.addClass("blueteam");
        }
        $("#players").append(temp_dom);
      }
    }
  });
}

function UpdateGameData() {
  $.ajax({
    url: "getstatedata",
    type: "GET",
    dataType: "json",
    headers: { user_id: user_id },
    success: function(data) {
      // display current users
      states = data;
      console.log("version: " + version);
      console.log(states);
    }
  });
}

function JoinGame() {
  $.ajax({
    url: "joingame",
    type: "GET",
    dataType: "json",
    headers: { user_id: user_id },
    success: function(data) {
      GetPlayerID();
      ingame = true;
      gameinfo = data;
      IntervalUpdate();
    }
  });
}

function StartNewGame() {
  $.ajax({
    url: "startnewgame",
    type: "GET",
    dataType: "json",
    headers: { user_id: user_id },
    success: function(data) {}
  });
}

function GetHand() {
  $.ajax({
    url: "gethand",
    type: "GET",
    dataType: "json",
    headers: { user_id: user_id },
    success: function(data) {
      user_hand = data;
      UpdateHandDOM();
    }
  });
}

function GetScore() {
  $.ajax({
    url: "getscore",
    type: "GET",
    dataType: "json",
    headers: { user_id: user_id },
    success: function(data) {
      score_data = data;
      $("#score").text(
        score_data.team1.name +
          " " +
          score_data.team1.match_points +
          " - " +
          score_data.team2.name +
          " " +
          score_data.team2.match_points
      );
    }
  });
}

function CheckForUpdates() {
  $.ajax({
    url: "checkforupdates",
    type: "GET",
    dataType: "json",
    headers: { user_id: user_id },
    success: function(data) {
      if (version < data.version) {
        version = data.version;
        IntervalUpdate();
      }
    }
  });
}

function UpdateHandDOM() {
  $("#hand").empty();
  for (var i = 0; i < user_hand.length; i++) {
    var temp_dom = $("<button></button>").addClass("card");
    temp_dom.text(
      value_proper[user_hand[i].value] +
        " of " +
        suits_proper[user_hand[i].suit]
    );
    var temp_card = user_hand[i];
    temp_dom.click({ card: temp_card }, event =>
      SendRequest({ card: event.data.card })
    );
    $("#hand").append(temp_dom);
  }
}

function ShowValidSuits() {
  $("#suitselect").show();
  if (HandHasSuit(1) && states.flippedcard.suit != 1)
    $("#suitspades").prop("disabled", false);
  if (HandHasSuit(2) && states.flippedcard.suit != 2)
    $("#suitclubs").prop("disabled", false);
  if (HandHasSuit(3) && states.flippedcard.suit != 3)
    $("#suithearts").prop("disabled", false);
  if (HandHasSuit(4) && states.flippedcard.suit != 4)
    $("#suitdiamonds").prop("disabled", false);
  if (states.dealer.player_id == player_id)
    if (HandHasAnyBesidesSuit(states.flippedcard.suit)) {
      if (states.flippedcard.suit == 1)
        $("#suitspades").prop("disabled", false);
      if (states.flippedcard.suit == 2) $("#suitclubs").prop("disabled", false);
      if (states.flippedcard.suit == 3)
        $("#suithearts").prop("disabled", false);
      if (states.flippedcard.suit == 4)
        $("#suitdiamonds").prop("disabled", false);
    }
}

function UpdateScreen() {
  if (!!states) {
    // display face up card
    if (states.flippedcard)
      $("#flippedcard")
        .text(
          "Flipped card: " +
            value_proper[states.flippedcard.value] +
            " of " +
            suits_proper[states.flippedcard.suit]
        )
        .show();
    else $("#flippedcard").hide();

    if (states.trump > 0)
      $("#trump")
        .text("Trump is " + suits_proper[states.trump])
        .show();
    else $("#trump").hide();

    if (!!states.highest_card.card)
      $("#highestcard")
        .text(
          "Highest card is the " +
            value_proper[states.highest_card.card.value] +
            " of " +
            suits_proper[states.highest_card.card.suit] +
            " played by " +
            GetPlayerById(states.highest_card.player_id).name
        )
        .show();
    else $("#trump").hide();

    $("#phasetext").text("");
    $("#question").hide();
    $("#passbutton").hide();
    $("#suitselect").hide();
    $("#suitselect button").prop("disabled", true);
    $(".card").prop("disabled", true);
    if (states.current_player_id == player_id) {
      switch (states.current_state) {
        case 11:
          $("#phasetext").text(
            "Do you want order up the " +
              value_proper[states.flippedcard.value] +
              " of " +
              suits_proper[states.flippedcard.suit] +
              "?"
          );
          $("#question").show();
          break;
        case 12:
          // If dealer, they can't pass and must choose suit (Stick the Dealer)
          if (states.dealer.player_id == player_id) {
            $("#phasetext").text(
              "Choose a suit to make trump (Stick the Dealer)"
            );
            ShowValidSuits();
          } else {
            $("#phasetext").text("Choose a suit to make trump or pass");
            $("#passbutton").show();
            ShowValidSuits();
          }
          break;

        case 19:
          $("#phasetext").text("Choose a card to disgard");
          $(".card").prop("disabled", false);
          break;
        case 20:
          $("#phasetext").text("Go alone?");
          $("#question").show();
          break;
        case 21:
          $("#phasetext").text("Restard match?");
          $("#question").show();
          break;
        case 22:
          $("#phasetext").text("Choose a card to play");
          $(".card").prop("disabled", false);
          break;
        case 23:
          $("#phasetext").text("Choose a card to play");
          $(".card").prop("disabled", false);
          break;
        case 24:
          $("#phasetext").text("idk what now");
          break;
        default:
      }
    }
  }
}

function IntervalUpdate() {
  GetHand();
  GetScore();
  UpdatePlayerInfo();
  UpdateGameData();
  UpdateScreen();
  CheckForUpdates();
}

setInterval(() => {
  IntervalUpdate();
}, 3000);
