import Common "common";

module {
  public type TeamId = Common.TeamId;
  public type FixtureId = Common.FixtureId;
  public type TieId = Common.TieId;
  public type Timestamp = Common.Timestamp;

  public type Team = {
    id : TeamId;
    name : Text;
    shortCode : Text;
    crestUrl : ?Text;
  };

  public type MatchStatus = {
    #upcoming;
    #live;
    #completed;
  };

  public type Fixture = {
    id : FixtureId;
    homeTeamId : TeamId;
    awayTeamId : TeamId;
    matchday : Nat;
    kickoff : Timestamp;
    homeGoals : ?Nat;
    awayGoals : ?Nat;
    status : MatchStatus;
  };

  public type KnockoutRound = {
    #roundOf16;
    #quarterFinal;
    #semiFinal;
    #final;
  };

  public type KnockoutTie = {
    id : TieId;
    round : KnockoutRound;
    slot : Nat;
    homeTeamId : ?TeamId;
    awayTeamId : ?TeamId;
    homeGoals : ?Nat;
    awayGoals : ?Nat;
    homePenalties : ?Nat;
    awayPenalties : ?Nat;
    winnerTeamId : ?TeamId;
  };

  public type LeagueRow = {
    teamId : TeamId;
    teamName : Text;
    shortCode : Text;
    played : Nat;
    won : Nat;
    drawn : Nat;
    lost : Nat;
    goalsFor : Nat;
    goalsAgainst : Nat;
    goalDifference : Int;
    points : Nat;
  };

  public type MatchView = {
    id : FixtureId;
    homeTeamName : Text;
    awayTeamName : Text;
    homeGoals : ?Nat;
    awayGoals : ?Nat;
    matchday : Nat;
    kickoff : Timestamp;
    status : MatchStatus;
  };

  public type TieView = {
    id : TieId;
    round : KnockoutRound;
    slot : Nat;
    homeTeamName : ?Text;
    awayTeamName : ?Text;
    homeGoals : ?Nat;
    awayGoals : ?Nat;
    homePenalties : ?Nat;
    awayPenalties : ?Nat;
    winnerTeamName : ?Text;
  };

  public type BracketRoundView = {
    round : KnockoutRound;
    ties : [TieView];
  };

  public type TournamentState = {
    tournamentName : Text;
    stageLabel : Text;
  };

  public type AdminCredentials = {
    username : Text;
    password : Text;
  };

  public type AdminSession = {
    token : Text;
    username : Text;
  };

  public type AdminError = {
    #invalidCredentials;
    #notAuthenticated;
    #notFound;
    #invalidInput : Text;
  };
};
