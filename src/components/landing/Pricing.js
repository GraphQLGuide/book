import React from 'react'

import './Pricing.css'
import Package from './Package'
import Sup from './Sup'

const REST_LIFESPAN = new Date().getFullYear() - 2000

const Pricing = () => (
  <section className="Pricing" id="pricing">
    <div className="Pricing-individual">
      <Package basic color="gray" />
      <Package
        pro
        color="purple"
        updatePeriod={<span>Free updates for two years</span>}
        extraChapters={[
          'Server-Side Rendering',
          'Apollo Federation',
          'Server Analytics',
        ]}
        videos={[
          'Introduction to the codebases',
          'Apollo Devtools',
          'Apollo Studio',
        ]}
      />
      <Package
        full
        color="pink"
        recommended
        updatePeriod={
          <span>
            Free <b>lifetime</b> updates
            <Sup>1</Sup>
          </span>
        }
        extraChapters={[
          'Stripe and Service Integrations',
          'Preventing DoS Attacks',
        ]}
        videos={[
          'Code run-throughs of Chapters 6–11',
          <span>
            Interview with{' '}
            <a
              href="https://www.scotttolinski.com/?ref=guide"
              target="_blank"
              rel="noopener noreferrer"
            >
              Scott Tolinski
            </a>
          </span>,
          <span>
            Interview with{' '}
            <a
              href="https://www.swyx.io/?ref=guide"
              target="_blank"
              rel="noopener noreferrer"
            >
              Shawn “swyx” Wang
            </a>
          </span>,
        ]}
      />
      <Package training price="749" color="blue">
        <li>Everything in the Full edition, plus a day-long training course</li>
        <hr />
        <li>
          Choose between three courses: Intro to GraphQL, Intro to Fullstack
          Apollo, and Advanced Dev. All use JavaScript (React and Node).
        </li>
        <hr />
        <li>
          Advanced course topics include auth, subscriptions, caching, batching,
          and federation
        </li>
        <hr />
        <li>
          Taught by Eve and Alex, our excellent education partners at Moon
          Highway
        </li>
        <hr />
        <li>
          Offered periodically online (alternatively, your company can sponsor
          and schedule a training:{' '}
          <a href="mailto:sales@graphql.guide">sales@graphql.guide</a>)
        </li>
      </Package>
    </div>

    <div className="Pricing-notes" id="pricing-notes">
      <div className="Pricing-note">
        <sup>1</sup> Free updates for the lifetime of the book. We’ll keep it up
        to date for at least 4 years, but we hope to continue for as long as
        GraphQL is the best data-fetching system out there. (Which is probably a
        long time—REST has been around for {REST_LIFESPAN} years!)
        <br />
        <sup>2</sup> Coming soon.
      </div>
    </div>

    <div className="Pricing-group">
      <Package team color="orange">
        <li>
          Get a <b>20% discount</b> over individual pricing by ordering a group
          license to the <b>Pro&nbsp;package</b> for your team.
        </li>
        <hr />
        <li>
          We can also arrange a day or two of training for your company. Inquire
          at:
        </li>
        <p style={{ textAlign: 'center' }}>
          <a href="mailto:sales@graphql.guide">sales@graphql.guide</a>
        </p>
      </Package>

      <Package fullteam color="green">
        <li>
          Get a <b>30% discount</b> over individual pricing by ordering a group
          license to the <b>Full&nbsp;package</b> for your team.
        </li>
        <hr />
        <li>
          We can also arrange a day or two of on-site training for your company.
          Inquire at:
        </li>
        <p style={{ textAlign: 'center' }}>
          <a href="mailto:sales@graphql.guide">sales@graphql.guide</a>
        </p>
      </Package>
    </div>
  </section>
)

export default Pricing
