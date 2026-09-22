import AccessControl "mo:caffeineai-authorization/access-control";
import MixinAuthorization "mo:caffeineai-authorization/MixinAuthorization";
import Expose "mo:caffeineai-oql/Expose";
import Entity "mo:caffeineai-oql/Entity";
import MapEntity "mo:caffeineai-oql/MapEntity";
import TextValue "mo:caffeineai-oql/TextValue";
import NatValue "mo:caffeineai-oql/NatValue";
import IntValue "mo:caffeineai-oql/IntValue";
import TournamentLib "lib/tournament";
import TournamentApiMixin "mixins/tournament-api";
import ApiDocMixin "mixins/api-doc";

actor {
  let accessControlState : AccessControl.AccessControlState;
  let tournamentState : TournamentLib.State;
  include MixinAuthorization(accessControlState, null);
  include TournamentApiMixin(tournamentState);
  include ApiDocMixin();
  include Expose({
    entities = [
      tournamentState.teams.toEntityManual("team", "Team", "id")
        .sample({ id = 0; name = ""; shortCode = ""; crestUrl = null })
        .payload("name", func t = t.name)
        .payload("shortCode", func t = t.shortCode)
        .payload("crestUrl", func t = t.crestUrl ?? "")
        .public_()
        .build(),
      tournamentState.fixtures.toEntityManual("fixture", "Fixture", "id")
        .sample({
          id = 0;
          homeTeamId = 0;
          awayTeamId = 0;
          matchday = 0;
          kickoff = 0;
          homeGoals = null;
          awayGoals = null;
          status = #upcoming;
        })
        .payload("homeTeamId", func f = f.homeTeamId)
        .payload("awayTeamId", func f = f.awayTeamId)
        .payload("matchday", func f = f.matchday)
        .payload("kickoff", func f = f.kickoff)
        .payload("homeGoals", func f = f.homeGoals ?? 0)
        .payload("awayGoals", func f = f.awayGoals ?? 0)
        .payload("status", func f = TournamentLib.statusText(f.status))
        .edge("homeTeamId", "team")
        .edge("awayTeamId", "team")
        .public_()
        .build(),
      tournamentState.ties.toEntityManual("knockoutTie", "KnockoutTie", "id")
        .sample({
          id = 0;
          round = #roundOf16;
          slot = 0;
          homeTeamId = null;
          awayTeamId = null;
          homeGoals = null;
          awayGoals = null;
          homePenalties = null;
          awayPenalties = null;
          winnerTeamId = null;
        })
        .payload("round", func t = TournamentLib.roundText(t.round))
        .payload("slot", func t = t.slot)
        .payload("homeTeamId", func t = t.homeTeamId ?? 0)
        .payload("awayTeamId", func t = t.awayTeamId ?? 0)
        .payload("homeGoals", func t = t.homeGoals ?? 0)
        .payload("awayGoals", func t = t.awayGoals ?? 0)
        .payload("homePenalties", func t = t.homePenalties ?? 0)
        .payload("awayPenalties", func t = t.awayPenalties ?? 0)
        .payload("winnerTeamId", func t = t.winnerTeamId ?? 0)
        .edge("homeTeamId", "team")
        .edge("awayTeamId", "team")
        .edge("winnerTeamId", "team")
        .public_()
        .build(),
    ];
  });
};
