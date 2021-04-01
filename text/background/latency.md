# Latency

Latency is the period between one machine sending a message over the internet and the other machine receiving it. It’s usually talked about in terms of round-trip time: the time it takes for the message to get to the destination and for a reply to reach the source. The `ping` command-line tool displays round-trip time between our computer and another machine. Here, we see that it takes around 5 milliseconds total for a message to reach the nearest Google server and for the reply to arrive back:

```sh
$ ping google.com
PING google.com (172.217.10.142): 56 data bytes
64 bytes from 172.217.10.142: icmp_seq=0 ttl=56 time=3.919 ms
64 bytes from 172.217.10.142: icmp_seq=1 ttl=56 time=5.375 ms
64 bytes from 172.217.10.142: icmp_seq=2 ttl=56 time=4.930 ms
64 bytes from 172.217.10.142: icmp_seq=3 ttl=56 time=5.206 ms
64 bytes from 172.217.10.142: icmp_seq=4 ttl=56 time=5.132 ms
^C
--- google.com ping statistics ---
5 packets transmitted, 5 packets received, 0.0% packet loss
round-trip min/avg/max/stddev = 3.919/4.912/5.375/0.517 ms
```

It generally takes longer to reach servers that are physically farther away. The internet backbone is made of fiber optic cables, and the light messages travelling through them have a maximum speed. It takes 75 ms for a message to go from New York across the Atlantic Ocean to Paris and back. And the same to cross the U.S. to San Francisco and back. 164 ms from New York to Tokyo, and 252 ms from New York to Shanghai.

> These numbers have one exception, which is near-Earth satellite networks like [Starlink](https://en.wikipedia.org/wiki/Starlink_(satellite_constellation)). The satellites are so close, the latency between them and the ground can be as low as 7 ms. The satellites communicate with each other by light, and light travels faster in straight lines through space than in cables curved over the Earth’s surface, so latency to far-off locations is reduced!

Why do developers need to know about latency? Because we never want to keep our users waiting! If our web server is in New York, our database is in Shanghai, and our user is in San Francisco, and the request requires 3 database requests in series, and our server code takes 20ms, then the user won’t receive a response for (75 + 252 * 3 + 20) = 851 ms! (And this is assuming the [TCP](http.md) connection is already set up, which would require another round trip from the user to the server, not to mention the longer SSL handshake if it’s HTTPS.) Almost one second is a long time for our user, whose human brain [notices delays](https://developers.google.com/web/fundamentals/performance/rail)
as short as 100ms. This is why we try to locate our database server in the same data center as our web server (for example both in Amazon’s [`us-east-1`](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/using-regions-availability-zones.html)). It’s why we use a [CDN](cdn.md) to get our files on servers around the world, closer to our users. It’s also why we try to reduce the number of sequential requests we need to make between the client and the server, and why it’s so important we can put all of our queries in a single GraphQL request.

