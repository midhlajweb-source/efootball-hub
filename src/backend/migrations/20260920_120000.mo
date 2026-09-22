import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";

module {
  type OldActor = {};

  type Team = {
    id : Nat;
    name : Text;
    shortCode : Text;
    crestUrl : ?Text;
  };

  type MatchStatus = {
    #upcoming;
    #live;
    #completed;
  };

  type Fixture = {
    id : Nat;
    homeTeamId : Nat;
    awayTeamId : Nat;
    matchday : Nat;
    kickoff : Int;
    homeGoals : ?Nat;
    awayGoals : ?Nat;
    status : MatchStatus;
  };

  type KnockoutRound = {
    #roundOf16;
    #quarterFinal;
    #semiFinal;
    #final;
  };

  type KnockoutTie = {
    id : Nat;
    round : KnockoutRound;
    slot : Nat;
    homeTeamId : ?Nat;
    awayTeamId : ?Nat;
    homeGoals : ?Nat;
    awayGoals : ?Nat;
    winnerTeamId : ?Nat;
  };

  type AdminSession = {
    token : Text;
    username : Text;
  };

  type TournamentState = {
    var tournamentName : Text;
    var stageLabel : Text;
    var nextTeamId : Nat;
    var nextFixtureId : Nat;
    var nextTieId : Nat;
    var nextSessionId : Nat;
    teams : Map.Map<Nat, Team>;
    fixtures : Map.Map<Nat, Fixture>;
    ties : Map.Map<Nat, KnockoutTie>;
    sessions : Map.Map<Text, AdminSession>;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    tournamentState : TournamentState;
  };

  public func migration(_old : OldActor) : NewActor {
    {
      accessControlState = AccessControl.initState();
      tournamentState = {
        var tournamentName = "eFootball Tournament";
        var stageLabel = "League Stage";
        var nextTeamId = 1;
        var nextFixtureId = 1;
        var nextTieId = 1;
        var nextSessionId = 1;
        teams = Map.empty();
        fixtures = Map.empty();
        ties = Map.empty();
        sessions = Map.empty();
      };
    };
  };
};
