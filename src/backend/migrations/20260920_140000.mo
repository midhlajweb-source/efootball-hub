import AccessControl "mo:caffeineai-authorization/access-control";
import Map "mo:core/Map";

module {
  type OldActor = {
    accessControlState : AccessControl.AccessControlState;
    tournamentState : {
      var tournamentName : Text;
      var stageLabel : Text;
      var nextTeamId : Nat;
      var nextFixtureId : Nat;
      var nextTieId : Nat;
      var nextSessionId : Nat;
      teams : Map.Map<Nat, OldTeam>;
      fixtures : Map.Map<Nat, OldFixture>;
      ties : Map.Map<Nat, OldKnockoutTie>;
      sessions : Map.Map<Text, OldAdminSession>;
    };
  };

  type OldTeam = {
    id : Nat;
    name : Text;
    shortCode : Text;
    crestUrl : ?Text;
  };

  type OldMatchStatus = {
    #upcoming;
    #live;
    #completed;
  };

  type OldFixture = {
    id : Nat;
    homeTeamId : Nat;
    awayTeamId : Nat;
    matchday : Nat;
    kickoff : Int;
    homeGoals : ?Nat;
    awayGoals : ?Nat;
    status : OldMatchStatus;
  };

  type OldKnockoutRound = {
    #roundOf16;
    #quarterFinal;
    #semiFinal;
    #final;
  };

  type OldKnockoutTie = {
    id : Nat;
    round : OldKnockoutRound;
    slot : Nat;
    homeTeamId : ?Nat;
    awayTeamId : ?Nat;
    homeGoals : ?Nat;
    awayGoals : ?Nat;
    winnerTeamId : ?Nat;
  };

  type OldAdminSession = {
    token : Text;
    username : Text;
  };

  type NewKnockoutTie = {
    id : Nat;
    round : OldKnockoutRound;
    slot : Nat;
    homeTeamId : ?Nat;
    awayTeamId : ?Nat;
    homeGoals : ?Nat;
    awayGoals : ?Nat;
    homePenalties : ?Nat;
    awayPenalties : ?Nat;
    winnerTeamId : ?Nat;
  };

  type NewActor = {
    accessControlState : AccessControl.AccessControlState;
    tournamentState : {
      var tournamentName : Text;
      var stageLabel : Text;
      var nextTeamId : Nat;
      var nextFixtureId : Nat;
      var nextTieId : Nat;
      var nextSessionId : Nat;
      teams : Map.Map<Nat, OldTeam>;
      fixtures : Map.Map<Nat, OldFixture>;
      ties : Map.Map<Nat, NewKnockoutTie>;
      sessions : Map.Map<Text, OldAdminSession>;
    };
  };

  public func migration(old : OldActor) : NewActor {
    let ties = old.tournamentState.ties.map<Nat, OldKnockoutTie, NewKnockoutTie>(
      func(_, tie) {
        {
          tie with
          homePenalties = null;
          awayPenalties = null;
        };
      },
    );
    {
      accessControlState = old.accessControlState;
      tournamentState = {
        var tournamentName = old.tournamentState.tournamentName;
        var stageLabel = old.tournamentState.stageLabel;
        var nextTeamId = old.tournamentState.nextTeamId;
        var nextFixtureId = old.tournamentState.nextFixtureId;
        var nextTieId = old.tournamentState.nextTieId;
        var nextSessionId = old.tournamentState.nextSessionId;
        teams = old.tournamentState.teams;
        fixtures = old.tournamentState.fixtures;
        ties;
        sessions = old.tournamentState.sessions;
      };
    };
  };
};
